import React, { useState, useEffect, useMemo } from 'react';
import {
  BudgetState,
  Category,
  SplitMode,
  Transaction,
} from './types/budget';
import {
  DEFAULT_MONTH_KEY,
  getInitialBudgetState,
  loadBudgetState,
  saveBudgetState,
} from './utils/storage';
import {
  calculateMonthlyMetrics,
  formatCurrency,
  shiftMonthKey,
} from './utils/calculations';
import { getSubcategoryIconName } from './components/IconPicker';
import { SetupWizard } from './components/SetupWizard';
import { HomeDashboard } from './components/HomeDashboard';
import { TransactionsView } from './components/TransactionsView';
import { MonthlyView } from './components/MonthlyView';
import { SettingsView } from './components/SettingsView';
import { ExpenseModal } from './components/ExpenseModal';
import {
  Home,
  Receipt,
  CalendarRange,
  Settings,
  Plus,
  AlertTriangle,
} from 'lucide-react';

type ActiveTab = 'home' | 'transactions' | 'monthly' | 'settings';

export default function App() {
  const [state, setState] = useState<BudgetState>(() => loadBudgetState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeMonthKey, setActiveMonthKey] = useState<string>(DEFAULT_MONTH_KEY);

  // Expense Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [modalInitialCatId, setModalInitialCatId] = useState<string | undefined>(undefined);
  const [modalInitialSubId, setModalInitialSubId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Persist every state update to localStorage
  useEffect(() => {
    saveBudgetState(state);
  }, [state]);

  // Real-time calculated metrics for the selected month
  const metrics = useMemo(
    () => calculateMonthlyMetrics(state, activeMonthKey),
    [state, activeMonthKey]
  );

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setActiveMonthKey((prev) => shiftMonthKey(prev, -1));
  };

  const handleNextMonth = () => {
    setActiveMonthKey((prev) => shiftMonthKey(prev, 1));
  };

  // First-Time Setup Save Handler
  const handleSaveSetup = (income: number, updatedCategories: Category[]) => {
    setState((prev) => ({
      ...prev,
      hasCompletedSetup: true,
      showSetupBanner: false,
      monthlyIncome: income,
      splitMode: 'percentage',
      categories: updatedCategories,
    }));
  };

  // Reset / Load Demo Data Handler
  const handleResetToDemo = () => {
    const freshDemo = getInitialBudgetState();
    setState({
      ...freshDemo,
      hasCompletedSetup: true,
      showSetupBanner: false,
    });
    setActiveMonthKey(DEFAULT_MONTH_KEY);
  };

  // Open Expense Modal for New Expense
  const handleOpenAddExpense = (categoryId?: string, subcategoryId?: string) => {
    setEditingTransaction(null);
    setModalInitialCatId(categoryId);
    setModalInitialSubId(subcategoryId);
    setIsExpenseModalOpen(true);
  };

  // Open Expense Modal for Editing Existing Transaction
  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialCatId(tx.categoryId);
    setModalInitialSubId(tx.subcategoryId);
    setIsExpenseModalOpen(true);
  };

  // Save (Create or Update) Expense
  const handleSaveExpense = (data: {
    id?: string;
    amount: number;
    categoryId: string;
    subcategoryId: string;
    subcategoryName: string;
    note: string;
    date: string;
  }) => {
    setState((prev) => {
      if (data.id) {
        // Edit existing transaction
        const updatedTx = prev.transactions.map((t) =>
          t.id === data.id
            ? {
                ...t,
                amount: data.amount,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                subcategoryName: data.subcategoryName,
                note: data.note,
                date: data.date,
              }
            : t
        );
        return { ...prev, transactions: updatedTx };
      } else {
        // Create new transaction
        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount: data.amount,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId,
          subcategoryName: data.subcategoryName,
          note: data.note,
          date: data.date,
          createdAt: Date.now(),
        };
        return {
          ...prev,
          transactions: [newTx, ...prev.transactions],
        };
      }
    });

    // If the recorded expense is in a different month, jump to that month so user sees it immediately
    const expenseMonthKey = data.date.slice(0, 7);
    if (expenseMonthKey && expenseMonthKey.length === 7) {
      setActiveMonthKey(expenseMonthKey);
    }
  };

  // Delete Expense
  const handleDeleteTransaction = (txId: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== txId),
    }));
  };

  // Subcategory Management Handlers
  const handleAddSubcategory = (
    categoryId: string,
    name: string,
    limit: number | null
  ): string => {
    const newSubId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subcategories: [
            ...cat.subcategories,
            {
              id: newSubId,
              name,
              limit,
              icon: getSubcategoryIconName(name, cat.icon),
            },
          ],
        };
      }),
    }));
    return newSubId;
  };

  const handleUpdateSubcategory = (
    categoryId: string,
    subcategoryId: string,
    name: string,
    limit: number | null
  ) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) =>
            sub.id === subcategoryId
              ? {
                  ...sub,
                  name,
                  limit,
                  icon: getSubcategoryIconName(name, cat.icon),
                }
              : sub
          ),
        };
      }),
      // Also update matching transaction subcategory names for consistency
      transactions: prev.transactions.map((tx) =>
        tx.categoryId === categoryId && tx.subcategoryId === subcategoryId
          ? { ...tx, subcategoryName: name }
          : tx
      ),
    }));
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subcategories: cat.subcategories.filter((s) => s.id !== subcategoryId),
        };
      }),
    }));
  };

  // Category & Budget Split Management Handlers
  const handleUpdateBudgetSplit = (
    newIncome: number,
    newSplitMode: SplitMode,
    updatedCategories: Category[]
  ) => {
    setState((prev) => ({
      ...prev,
      monthlyIncome: newIncome,
      splitMode: newSplitMode,
      categories: updatedCategories,
    }));
  };

  const handleToggleIncludeSavings = (include: boolean) => {
    setState((prev) => ({
      ...prev,
      includeSavingsInAvailable: include,
    }));
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const createdId = `cat-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...newCat, id: createdId }],
    }));
  };

  const handleUpdateCategory = (categoryId: string, updates: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      ),
    }));
  };

  const handleDeleteCategory = (categoryId: string) => {
    setState((prev) => {
      if (prev.categories.length <= 1) return prev;
      const remainingCats = prev.categories.filter((c) => c.id !== categoryId);
      return {
        ...prev,
        categories: remainingCats,
        transactions: prev.transactions.filter((tx) => tx.categoryId !== categoryId),
      };
    });
  };

  const handleSetMonthlyIncomeOverride = (
    monthKey: string,
    income: number | undefined
  ) => {
    setState((prev) => {
      const nextOverrides = { ...prev.monthlyOverrides };
      if (typeof income === 'number') {
        nextOverrides[monthKey] = { monthKey, income };
      } else {
        delete nextOverrides[monthKey];
      }
      return {
        ...prev,
        monthlyOverrides: nextOverrides,
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#F3F4F6] flex flex-col">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 h-14 bg-[#0B0D11]/90 backdrop-blur-md border-b border-white/8 px-4 sm:px-6 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap"
        >
          BudgetFlow
        </a>

        {/* Zone 2: Clean text navigation links on desktop */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeTab === 'home'
                ? 'text-white underline decoration-[#FF6B2C] decoration-2 underline-offset-8'
                : 'hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'text-white underline decoration-[#FF6B2C] decoration-2 underline-offset-8'
                : 'hover:text-white'
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'text-white underline decoration-[#FF6B2C] decoration-2 underline-offset-8'
                : 'hover:text-white'
            }`}
          >
            Monthly View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-white underline decoration-[#FF6B2C] decoration-2 underline-offset-8'
                : 'hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setState((prev) => ({ ...prev, showSetupBanner: !prev.showSetupBanner }));
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-200 transition-colors whitespace-nowrap"
          >
            {state.showSetupBanner ? 'Hide Setup' : 'Set Budget'}
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddExpense()}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#FF6B2C] hover:bg-[#ff7d47] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-md shadow-[#FF6B2C]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Primary Mobile-First Interactive Stream (8 cols on desktop) */}
          <div className="lg:col-span-8">
            {/* First-Time Setup Wizard (Shown on first visit or when toggled) */}
            {state.showSetupBanner && activeTab === 'home' && (
              <SetupWizard
                initialIncome={state.monthlyIncome}
                categories={state.categories}
                currencySymbol={state.currencySymbol}
                onSaveSetup={handleSaveSetup}
                onLoadDemo={handleResetToDemo}
                onDismiss={() =>
                  setState((prev) => ({ ...prev, showSetupBanner: false }))
                }
              />
            )}

            {activeTab === 'home' && (
              <HomeDashboard
                metrics={metrics}
                currencySymbol={state.currencySymbol}
                includeSavingsInAvailable={state.includeSavingsInAvailable}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onOpenAddExpense={handleOpenAddExpense}
                onEditTransaction={handleOpenEditTransaction}
                onAddSubcategory={(catId, name, limit) => {
                  handleAddSubcategory(catId, name, limit);
                }}
                onUpdateSubcategory={handleUpdateSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onOpenSetup={() =>
                  setState((prev) => ({ ...prev, showSetupBanner: true }))
                }
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                metrics={metrics}
                categories={state.categories}
                currencySymbol={state.currencySymbol}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onOpenAddExpense={handleOpenAddExpense}
                onEditTransaction={handleOpenEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeTab === 'monthly' && (
              <MonthlyView
                metrics={metrics}
                currencySymbol={state.currencySymbol}
                hasMonthOverride={Boolean(state.monthlyOverrides[activeMonthKey])}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onSetMonthlyIncomeOverride={handleSetMonthlyIncomeOverride}
                onOpenAddExpense={handleOpenAddExpense}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                monthlyIncome={state.monthlyIncome}
                splitMode={state.splitMode}
                includeSavingsInAvailable={state.includeSavingsInAvailable}
                categories={state.categories}
                currencySymbol={state.currencySymbol}
                onUpdateBudgetSplit={handleUpdateBudgetSplit}
                onToggleIncludeSavings={handleToggleIncludeSavings}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddSubcategory={(catId, name, limit) => {
                  handleAddSubcategory(catId, name, limit);
                }}
                onUpdateSubcategory={handleUpdateSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onOpenSetupWizard={() => {
                  setActiveTab('home');
                  setState((prev) => ({ ...prev, showSetupBanner: true }));
                }}
                onResetToDemo={handleResetToDemo}
              />
            )}
          </div>

          {/* Desktop Companion Financial Pulse Sidebar (4 cols on lg+) */}
          <aside
            aria-label="Live Financial Pulse"
            className="hidden lg:block lg:col-span-4 sticky top-20 space-y-5"
          >
            {/* Quick Balance Distinction Card */}
            <div className="bg-[#161A23] border border-white/8 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[#FF6B2C]">
                  LIVE MONEY BREAKDOWN
                </span>
                <span className="text-xs font-mono-tabular text-neutral-400">
                  {metrics.monthLabel}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/6">
                  <span className="text-neutral-400">1. Monthly Take-Home Income</span>
                  <span className="font-mono-tabular font-bold text-white text-sm">
                    {formatCurrency(metrics.monthlyIncome, state.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/6">
                  <span className="text-neutral-400">2. Spending Budget Allocated</span>
                  <span className="font-mono-tabular font-semibold text-white">
                    {formatCurrency(
                      metrics.totalAllocatedSpendingBudget,
                      state.currencySymbol
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/6">
                  <span className="text-neutral-400">3. Money Already Spent</span>
                  <span className="font-mono-tabular font-semibold text-[#FF6B2C]">
                    -{formatCurrency(metrics.totalAllExpenses, state.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="font-bold text-white">4. AVAILABLE TO SPEND</span>
                  <span
                    className={`font-mono-tabular font-bold text-base ${
                      metrics.availableToSpend < 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(metrics.availableToSpend, state.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/6">
                  <span className="text-neutral-400">5. Protected Savings</span>
                  <span className="font-mono-tabular font-semibold text-emerald-400">
                    {formatCurrency(metrics.savingsRemaining, state.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-300 font-medium">
                    Total Remaining (Incl. Savings)
                  </span>
                  <span className="font-mono-tabular font-bold text-emerald-300 text-sm">
                    {formatCurrency(
                      metrics.totalRemainingIncludingSavings,
                      state.currencySymbol
                    )}
                  </span>
                </div>
              </div>

              {/* Category Remaining Mini List */}
              <div className="pt-3 border-t border-white/8 space-y-2">
                <p className="text-xs font-semibold text-neutral-400">
                  Category Remaining Balances
                </p>
                {metrics.calculatedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-neutral-200 flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      {cat.isOverspent && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </span>
                    <span
                      className={`font-mono-tabular font-semibold ${
                        cat.isOverspent ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(cat.remaining, state.currencySymbol)} left
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddExpense()}
                className="w-full min-h-[46px] py-3 rounded-2xl bg-[#FF6B2C] hover:bg-[#ff7d47] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B2C]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Record Expense</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Orange "+" Button for Fast Expense Entry */}
      <button
        type="button"
        onClick={() => handleOpenAddExpense()}
        aria-label="Add Expense"
        className="fixed bottom-20 right-5 sm:bottom-8 sm:right-8 z-40 w-14 h-14 rounded-full bg-[#FF6B2C] hover:bg-[#ff7d47] text-white shadow-xl shadow-[#FF6B2C]/35 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Fixed Bottom Navigation Bar on Mobile */}
      <nav
        aria-label="Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0B0D11]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 items-center px-2"
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'home'
              ? 'text-[#FF6B2C]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'transactions'
              ? 'text-[#FF6B2C]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">
            Transactions
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'monthly'
              ? 'text-[#FF6B2C]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarRange className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">
            Monthly
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'settings'
              ? 'text-[#FF6B2C]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">
            Settings
          </span>
        </button>
      </nav>

      {/* Fast Expense Entry & Edit Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        categories={state.categories}
        currencySymbol={state.currencySymbol}
        activeMonthKey={activeMonthKey}
        initialCategoryId={modalInitialCatId}
        initialSubcategoryId={modalInitialSubId}
        editingTransaction={editingTransaction}
        onSaveExpense={handleSaveExpense}
        onQuickAddSubcategory={(catId, name) =>
          handleAddSubcategory(catId, name, null)
        }
      />
    </div>
  );
}
