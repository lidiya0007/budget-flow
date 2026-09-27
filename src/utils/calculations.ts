import {
  BudgetState,
  CalculatedCategory,
  CalculatedSubcategory,
  MonthlyDashboardMetrics,
  Transaction,
} from '../types/budget';
import { DEFAULT_TODAY_STR } from './storage';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return monthKey;
  }
  return `${MONTH_NAMES[monthIdx]} ${year}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIdx + deltaMonths, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const rounded = Number.isInteger(absVal) ? absVal : Number(absVal.toFixed(2));
  const formatted = rounded.toLocaleString('en-IN');
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function isWithinSameWeek(dateStr: string, anchorDateStr: string): boolean {
  const [y1, m1, d1] = dateStr.split('-').map(Number);
  const [y2, m2, d2] = anchorDateStr.split('-').map(Number);
  const target = new Date(y1, m1 - 1, d1);
  const anchor = new Date(y2, m2 - 1, d2);
  const diffDays = (anchor.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 7;
}

export function calculateMonthlyMetrics(
  state: BudgetState,
  monthKey: string,
  referenceTodayStr: string = DEFAULT_TODAY_STR
): MonthlyDashboardMetrics {
  const override = state.monthlyOverrides[monthKey];
  const monthlyIncome =
    override && typeof override.income === 'number' ? override.income : state.monthlyIncome;

  // Filter transactions belonging to the selected month (YYYY-MM)
  const monthTransactions = state.transactions
    .filter((tx) => tx.date.startsWith(monthKey))
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });

  // Calculate per-category & per-subcategory metrics
  const calculatedCategories: CalculatedCategory[] = state.categories.map((cat) => {
    const budget =
      state.splitMode === 'percentage'
        ? Math.round((monthlyIncome * cat.percentage) / 100)
        : Math.round(cat.fixedAmount);

    const catTransactions = monthTransactions.filter((tx) => tx.categoryId === cat.id);
    const spent = catTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget - spent;
    const percentageUsed = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
    const isOverspent = remaining < 0;
    const overspentAmount = isOverspent ? Math.abs(remaining) : 0;

    const calculatedSubcategories: CalculatedSubcategory[] = cat.subcategories.map((sub) => {
      const subSpent = catTransactions
        .filter(
          (tx) =>
            tx.subcategoryId === sub.id ||
            tx.subcategoryName.toLowerCase() === sub.name.toLowerCase()
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const subRemaining = sub.limit !== null ? sub.limit - subSpent : null;
      const subPct =
        sub.limit !== null && sub.limit > 0
          ? (subSpent / sub.limit) * 100
          : subSpent > 0
          ? 100
          : 0;
      const subOverspent = subRemaining !== null && subRemaining < 0;
      const subOverspentAmount = subOverspent && subRemaining !== null ? Math.abs(subRemaining) : 0;

      return {
        ...sub,
        spent: subSpent,
        remaining: subRemaining,
        percentageUsed: subPct,
        isOverspent: subOverspent,
        overspentAmount: subOverspentAmount,
      };
    });

    return {
      ...cat,
      budget,
      spent,
      remaining,
      percentageUsed,
      isOverspent,
      overspentAmount,
      calculatedSubcategories,
    };
  });

  // Spending categories vs Savings categories
  const spendingCategories = calculatedCategories.filter((c) => !c.isSavings);
  const savingsCategories = calculatedCategories.filter((c) => c.isSavings);

  const spendingBudgetSum = spendingCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSavingsAllocated = savingsCategories.reduce((sum, c) => sum + c.budget, 0);

  const totalSpendingExpenses = spendingCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalSavingsExpenses = savingsCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalAllExpenses = totalSpendingExpenses + totalSavingsExpenses;

  // Core requirement:
  // TOTAL AVAILABLE TO SPEND = TOTAL ALLOCATED SPENDING BUDGET - TOTAL EXPENSES
  // Do NOT count the savings allocation as available spending unless the user explicitly allows it.
  const totalAllocatedSpendingBudget = state.includeSavingsInAvailable
    ? spendingBudgetSum + totalSavingsAllocated
    : spendingBudgetSum;

  const availableToSpend = state.includeSavingsInAvailable
    ? totalAllocatedSpendingBudget - totalAllExpenses
    : spendingBudgetSum - totalSpendingExpenses;

  const savingsRemaining = totalSavingsAllocated - totalSavingsExpenses;
  const totalRemainingIncludingSavings =
    spendingBudgetSum - totalSpendingExpenses + savingsRemaining;

  // Spending summary: Today, This Week, This Month
  // If user is viewing the current anchor month (e.g., 2026-09), use referenceTodayStr.
  // Otherwise, compute Today/Week relative to the most recent transaction date in that month or referenceTodayStr.
  const activeAnchorDate = monthKey === referenceTodayStr.slice(0, 7)
    ? referenceTodayStr
    : `${monthKey}-27`;

  const todaySpent = monthTransactions
    .filter((tx) => tx.date === activeAnchorDate)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const weekSpent = monthTransactions
    .filter((tx) => isWithinSameWeek(tx.date, activeAnchorDate))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthSpent = totalAllExpenses;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    monthlyIncome,
    totalAllocatedSpendingBudget,
    totalSavingsAllocated,
    totalSpendingExpenses,
    totalSavingsExpenses,
    totalAllExpenses,
    availableToSpend,
    savingsRemaining,
    totalRemainingIncludingSavings,
    calculatedCategories,
    todaySpent,
    weekSpent,
    monthSpent,
    monthTransactions,
  };
}

export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: 'today' | 'week' | 'month',
  monthKey: string,
  referenceTodayStr: string = DEFAULT_TODAY_STR
): Transaction[] {
  const activeAnchorDate =
    monthKey === referenceTodayStr.slice(0, 7) ? referenceTodayStr : `${monthKey}-27`;

  if (timeframe === 'today') {
    return transactions.filter((tx) => tx.date === activeAnchorDate);
  }
  if (timeframe === 'week') {
    return transactions.filter((tx) => isWithinSameWeek(tx.date, activeAnchorDate));
  }
  return transactions;
}
