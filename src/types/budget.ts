export type SplitMode = 'percentage' | 'fixed';

export interface Subcategory {
  id: string;
  name: string;
  limit: number | null; // null represents "No Limit"
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  percentage: number; // 0 - 100
  fixedAmount: number; // in ₹
  isSavings: boolean; // If true, excluded from "Available to Spend" unless explicitly enabled
  color: 'orange' | 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
  subcategories: Subcategory[];
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  subcategoryId: string;
  subcategoryName: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface MonthlyOverride {
  monthKey: string; // YYYY-MM, e.g. "2026-09"
  income?: number;
}

export interface BudgetState {
  hasCompletedSetup: boolean;
  showSetupBanner: boolean;
  currencySymbol: string;
  monthlyIncome: number;
  splitMode: SplitMode;
  includeSavingsInAvailable: boolean;
  categories: Category[];
  transactions: Transaction[];
  monthlyOverrides: Record<string, MonthlyOverride>;
}

export interface CalculatedSubcategory extends Subcategory {
  spent: number;
  remaining: number | null; // null if limit is null
  percentageUsed: number;
  isOverspent: boolean;
  overspentAmount: number;
}

export interface CalculatedCategory extends Category {
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverspent: boolean;
  overspentAmount: number;
  calculatedSubcategories: CalculatedSubcategory[];
}

export interface MonthlyDashboardMetrics {
  monthKey: string; // "2026-09"
  monthLabel: string; // "September 2026"
  monthlyIncome: number;
  totalAllocatedSpendingBudget: number; // Sum of non-savings category budgets (or all if includeSavingsInAvailable)
  totalSavingsAllocated: number; // Sum of savings category budgets
  totalSpendingExpenses: number; // Sum of expenses in spending categories
  totalSavingsExpenses: number; // Sum of expenses in savings categories
  totalAllExpenses: number; // Sum of all recorded expenses in the month
  availableToSpend: number; // TOTAL ALLOCATED SPENDING BUDGET - TOTAL SPENDING EXPENSES
  savingsRemaining: number; // totalSavingsAllocated - totalSavingsExpenses
  totalRemainingIncludingSavings: number; // availableToSpend + savingsRemaining (if not already included)
  calculatedCategories: CalculatedCategory[];
  todaySpent: number;
  weekSpent: number;
  monthSpent: number;
  monthTransactions: Transaction[];
}
