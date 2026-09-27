import { BudgetState, Category, Transaction } from '../types/budget';

const STORAGE_KEY = 'budgetflow_app_state_v1';

// Reference anchor date matching environment local date (2026-09-27)
export const DEFAULT_TODAY_STR = '2026-09-27';
export const DEFAULT_YESTERDAY_STR = '2026-09-26';
export const DEFAULT_MONTH_KEY = '2026-09';

export function getDefaultCategories(monthlyIncome = 1600): Category[] {
  return [
    {
      id: 'cat-needs',
      name: 'Needs',
      icon: 'Home',
      percentage: 50,
      fixedAmount: Math.round(monthlyIncome * 0.5),
      isSavings: false,
      color: 'orange',
      subcategories: [
        { id: 'sub-rent', name: 'Rent', limit: 400, icon: 'Home' },
        { id: 'sub-food', name: 'Food', limit: 200, icon: 'Utensils' },
        { id: 'sub-travel', name: 'Travel', limit: null, icon: 'Car' },
        { id: 'sub-groceries', name: 'Groceries', limit: 100, icon: 'ShoppingCart' },
        { id: 'sub-bills', name: 'Bills', limit: 100, icon: 'Receipt' },
      ],
    },
    {
      id: 'cat-wants',
      name: 'Wants',
      icon: 'ShoppingBag',
      percentage: 30,
      fixedAmount: Math.round(monthlyIncome * 0.3),
      isSavings: false,
      color: 'amber',
      subcategories: [
        { id: 'sub-shopping', name: 'Shopping', limit: 200, icon: 'ShoppingBag' },
        { id: 'sub-dining', name: 'Dining Out', limit: 120, icon: 'Coffee' },
        { id: 'sub-entertainment', name: 'Entertainment', limit: 100, icon: 'Film' },
        { id: 'sub-clubbing', name: 'Clubbing', limit: null, icon: 'Music' },
      ],
    },
    {
      id: 'cat-savings',
      name: 'Savings',
      icon: 'PiggyBank',
      percentage: 20,
      fixedAmount: Math.round(monthlyIncome * 0.2),
      isSavings: true,
      color: 'emerald',
      subcategories: [
        { id: 'sub-emergency', name: 'Emergency Fund', limit: 150, icon: 'ShieldAlert' },
        { id: 'sub-investments', name: 'Investments', limit: 100, icon: 'TrendingUp' },
        { id: 'sub-goals', name: 'Future Goals', limit: null, icon: 'Target' },
      ],
    },
  ];
}

export function getInitialDemoTransactions(): Transaction[] {
  return [
    {
      id: 'tx-demo-1',
      amount: 150,
      categoryId: 'cat-needs',
      subcategoryId: 'sub-food',
      subcategoryName: 'Food',
      note: 'Lunch & daily meals',
      date: DEFAULT_TODAY_STR,
      createdAt: new Date('2026-09-27T13:15:00').getTime(),
    },
    {
      id: 'tx-demo-2',
      amount: 100,
      categoryId: 'cat-wants',
      subcategoryId: 'sub-shopping',
      subcategoryName: 'Shopping',
      note: 'Weekend essentials',
      date: DEFAULT_TODAY_STR,
      createdAt: new Date('2026-09-27T11:30:00').getTime(),
    },
    {
      id: 'tx-demo-3',
      amount: 50,
      categoryId: 'cat-needs',
      subcategoryId: 'sub-travel',
      subcategoryName: 'Travel',
      note: 'City transit & commute',
      date: DEFAULT_YESTERDAY_STR,
      createdAt: new Date('2026-09-26T18:45:00').getTime(),
    },
  ];
}

export function getInitialBudgetState(): BudgetState {
  const defaultIncome = 1600;
  return {
    hasCompletedSetup: false,
    showSetupBanner: true,
    currencySymbol: '₹',
    monthlyIncome: defaultIncome,
    splitMode: 'percentage',
    includeSavingsInAvailable: false,
    categories: getDefaultCategories(defaultIncome),
    transactions: getInitialDemoTransactions(),
    monthlyOverrides: {},
  };
}

export function loadBudgetState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getInitialBudgetState();
    }
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    const fallback = getInitialBudgetState();
    return {
      hasCompletedSetup: parsed.hasCompletedSetup ?? fallback.hasCompletedSetup,
      showSetupBanner: parsed.showSetupBanner ?? fallback.showSetupBanner,
      currencySymbol: parsed.currencySymbol || '₹',
      monthlyIncome: typeof parsed.monthlyIncome === 'number' ? parsed.monthlyIncome : fallback.monthlyIncome,
      splitMode: parsed.splitMode === 'fixed' ? 'fixed' : 'percentage',
      includeSavingsInAvailable: Boolean(parsed.includeSavingsInAvailable),
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : fallback.categories,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : fallback.transactions,
      monthlyOverrides: parsed.monthlyOverrides || {},
    };
  } catch {
    return getInitialBudgetState();
  }
}

export function saveBudgetState(state: BudgetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist BudgetFlow state:', err);
  }
}
