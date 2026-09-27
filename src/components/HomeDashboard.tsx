import React, { useState } from 'react';
import {
  CalculatedCategory,
  CalculatedSubcategory,
  MonthlyDashboardMetrics,
  Transaction,
} from '../types/budget';
import {
  filterTransactionsByTimeframe,
  formatCurrency,
} from '../utils/calculations';
import { DynamicIcon, getSubcategoryIconName } from './IconPicker';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface HomeDashboardProps {
  metrics: MonthlyDashboardMetrics;
  currencySymbol: string;
  includeSavingsInAvailable: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenAddExpense: (categoryId?: string, subcategoryId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onAddSubcategory: (categoryId: string, name: string, limit: number | null) => void;
  onUpdateSubcategory: (
    categoryId: string,
    subcategoryId: string,
    name: string,
    limit: number | null
  ) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onOpenSetup: () => void;
  onNavigateTab: (tab: 'home' | 'transactions' | 'monthly' | 'settings') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  metrics,
  currencySymbol,
  includeSavingsInAvailable,
  onPrevMonth,
  onNextMonth,
  onOpenAddExpense,
  onEditTransaction,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onOpenSetup,
  onNavigateTab,
}) => {
  const [summaryTimeframe, setSummaryTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    metrics.calculatedCategories.forEach((c) => {
      map[c.id] = true;
    });
    return map;
  });

  // Subcategory inline creation state per category
  const [addingSubToCat, setAddingSubToCat] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubNoLimit, setNewSubNoLimit] = useState<boolean>(false);
  const [newSubLimit, setNewSubLimit] = useState<string>('100');

  // Subcategory inline edit state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState<string>('');
  const [editSubNoLimit, setEditSubNoLimit] = useState<boolean>(false);
  const [editSubLimit, setEditSubLimit] = useState<string>('');

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: prev[catId] === false ? true : false,
    }));
  };

  const handleStartAddSub = (catId: string) => {
    setAddingSubToCat(catId);
    setNewSubName('');
    setNewSubNoLimit(false);
    setNewSubLimit('100');
  };

  const handleConfirmAddSub = (catId: string) => {
    const trimmed = newSubName.trim();
    if (!trimmed) return;
    const limitVal = newSubNoLimit ? null : Math.max(0, Number(newSubLimit) || 0);
    onAddSubcategory(catId, trimmed, limitVal);
    setAddingSubToCat(null);
    setNewSubName('');
  };

  const handleStartEditSub = (sub: CalculatedSubcategory) => {
    setEditingSubId(sub.id);
    setEditSubName(sub.name);
    setEditSubNoLimit(sub.limit === null);
    setEditSubLimit(sub.limit !== null ? String(sub.limit) : '');
  };

  const handleConfirmEditSub = (catId: string, subId: string) => {
    const trimmed = editSubName.trim();
    if (!trimmed) return;
    const limitVal = editSubNoLimit ? null : Math.max(0, Number(editSubLimit) || 0);
    onUpdateSubcategory(catId, subId, trimmed, limitVal);
    setEditingSubId(null);
  };

  const timeframeTransactions = filterTransactionsByTimeframe(
    metrics.monthTransactions,
    summaryTimeframe,
    metrics.monthKey
  );

  const isTotalOverspent = metrics.availableToSpend < 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-[#161A23] border border-white/8 rounded-2xl px-3 py-2">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {metrics.monthLabel}
          </h1>
          <p className="text-[11px] text-neutral-400">
            Monthly Cashflow & Spending Tracker
          </p>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dominant Hero Anchor: AVAILABLE TO SPEND */}
      <section
        aria-label="Available to Spend Summary"
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border transition-colors ${
          isTotalOverspent
            ? 'bg-gradient-to-br from-[#231419] via-[#181318] to-[#13161F] border-red-500/35'
            : 'bg-gradient-to-br from-[#1E222D] via-[#161A23] to-[#12151E] border-white/12'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold tracking-wider text-[#FF6B2C]">
            AVAILABLE TO SPEND
          </span>
          <button
            type="button"
            onClick={onOpenSetup}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Adjust Budget</span>
          </button>
        </div>

        <div className="flex items-baseline gap-3 my-1">
          <div
            data-testid="available-to-spend-amount"
            className={`text-4xl sm:text-5xl font-mono-tabular font-bold tracking-tight ${
              isTotalOverspent ? 'text-red-400' : 'text-white'
            }`}
          >
            {formatCurrency(metrics.availableToSpend, currencySymbol)}
          </div>
          {isTotalOverspent && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Over spending budget</span>
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-neutral-400 mb-6">
          Total money remaining after your recorded expenses
          {!includeSavingsInAvailable && ' (Savings protected separately)'}
        </p>

        {/* 5 Key Financial Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 border-t border-white/10">
          <div className="bg-[#0B0D11]/70 rounded-2xl p-3 border border-white/5">
            <p className="text-[11px] text-neutral-400 mb-1">Monthly Income</p>
            <p className="text-base font-mono-tabular font-semibold text-white">
              {formatCurrency(metrics.monthlyIncome, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11]/70 rounded-2xl p-3 border border-white/5">
            <p className="text-[11px] text-neutral-400 mb-1">Total Budgeted</p>
            <p className="text-base font-mono-tabular font-semibold text-white">
              {formatCurrency(metrics.totalAllocatedSpendingBudget, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11]/70 rounded-2xl p-3 border border-white/5">
            <p className="text-[11px] text-neutral-400 mb-1">Total Spent</p>
            <p className="text-base font-mono-tabular font-semibold text-[#FF6B2C]">
              {formatCurrency(metrics.totalAllExpenses, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11]/70 rounded-2xl p-3 border border-white/5">
            <p className="text-[11px] text-neutral-400 mb-1">Savings</p>
            <p className="text-base font-mono-tabular font-semibold text-emerald-400">
              {formatCurrency(metrics.savingsRemaining, currencySymbol)}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#0B0D11]/70 rounded-2xl p-3 border border-white/5">
            <p className="text-[11px] text-neutral-400 mb-1">Remaining</p>
            <p
              className={`text-base font-mono-tabular font-semibold ${
                metrics.availableToSpend < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {formatCurrency(metrics.availableToSpend, currencySymbol)}
            </p>
          </div>
        </div>

        {/* Explicit Distinction Footer Bar: Available to Spend vs Total Remaining Incl. Savings */}
        <div className="mt-4 pt-3.5 border-t border-white/8 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <span>
            Spending Budget Left:{' '}
            <strong className="font-mono-tabular text-white">
              {formatCurrency(metrics.availableToSpend, currencySymbol)}
            </strong>{' '}
            · Protected Savings:{' '}
            <strong className="font-mono-tabular text-emerald-400">
              {formatCurrency(metrics.savingsRemaining, currencySymbol)}
            </strong>
          </span>
          <span>
            Total Remaining (Incl. Savings):{' '}
            <strong className="font-mono-tabular text-emerald-300">
              {formatCurrency(metrics.totalRemainingIncludingSavings, currencySymbol)}
            </strong>
          </span>
        </div>
      </section>

      {/* SPENDING SUMMARY (TODAY / THIS WEEK / THIS MONTH) */}
      <section
        aria-label="Spending Summary"
        className="bg-[#161A23] border border-white/8 rounded-3xl p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Spending Summary</h2>
            <p className="text-xs text-neutral-400">
              Switch timeframe to inspect your recorded expenses
            </p>
          </div>

          {/* Interactive Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#0B0D11] rounded-xl border border-white/8 self-start sm:self-auto">
            {(['today', 'week', 'month'] as const).map((tf) => {
              const active = summaryTimeframe === tf;
              const labels = {
                today: 'Today',
                week: 'Week',
                month: 'Month',
              };
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSummaryTimeframe(tf)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#FF6B2C] text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {labels[tf]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSummaryTimeframe('today')}
            className={`text-left p-3.5 rounded-2xl border transition-colors ${
              summaryTimeframe === 'today'
                ? 'bg-[#0B0D11] border-[#FF6B2C]/60'
                : 'bg-[#0B0D11]/60 border-white/5 hover:border-white/15'
            }`}
          >
            <p className="text-[11px] font-semibold text-neutral-400">TODAY</p>
            <p className="text-lg sm:text-xl font-mono-tabular font-bold text-white mt-1">
              {formatCurrency(metrics.todaySpent, currencySymbol)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSummaryTimeframe('week')}
            className={`text-left p-3.5 rounded-2xl border transition-colors ${
              summaryTimeframe === 'week'
                ? 'bg-[#0B0D11] border-[#FF6B2C]/60'
                : 'bg-[#0B0D11]/60 border-white/5 hover:border-white/15'
            }`}
          >
            <p className="text-[11px] font-semibold text-neutral-400">THIS WEEK</p>
            <p className="text-lg sm:text-xl font-mono-tabular font-bold text-white mt-1">
              {formatCurrency(metrics.weekSpent, currencySymbol)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSummaryTimeframe('month')}
            className={`text-left p-3.5 rounded-2xl border transition-colors ${
              summaryTimeframe === 'month'
                ? 'bg-[#0B0D11] border-[#FF6B2C]/60'
                : 'bg-[#0B0D11]/60 border-white/5 hover:border-white/15'
            }`}
          >
            <p className="text-[11px] font-semibold text-neutral-400">THIS MONTH</p>
            <p className="text-lg sm:text-xl font-mono-tabular font-bold text-white mt-1">
              {formatCurrency(metrics.monthSpent, currencySymbol)}
            </p>
          </button>
        </div>

        {/* Active Timeframe Mini Feed */}
        <div className="border-t border-white/8 pt-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>
              Showing {timeframeTransactions.length}{' '}
              {timeframeTransactions.length === 1 ? 'expense' : 'expenses'} for{' '}
              <strong className="text-white capitalize">{summaryTimeframe}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="text-[#FF6B2C] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>All Transactions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {timeframeTransactions.length === 0 ? (
            <p className="text-xs text-neutral-500 py-2">
              No expenses recorded for this period yet.
            </p>
          ) : (
            <div className="divide-y divide-white/6">
              {timeframeTransactions.slice(0, 3).map((tx) => {
                const cat = metrics.calculatedCategories.find((c) => c.id === tx.categoryId);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onEditTransaction(tx)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] rounded-xl px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0B0D11] border border-white/8 flex items-center justify-center text-[#FF6B2C] shrink-0">
                        <DynamicIcon
                          name={getSubcategoryIconName(tx.subcategoryName, cat?.icon || 'Wallet')}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {tx.subcategoryName}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {cat?.name || 'Category'}
                          {tx.note ? ` · ${tx.note}` : ''} · {tx.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-mono-tabular font-semibold text-white shrink-0">
                      {formatCurrency(tx.amount, currencySymbol)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section aria-label="Budget Categories" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Category Budgets</h2>
            <p className="text-xs text-neutral-400">
              Real-time remaining balances across your categories & subcategories
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
          >
            Manage Categories
          </button>
        </div>

        <div className="space-y-4">
          {metrics.calculatedCategories.map((cat: CalculatedCategory) => {
            const isExpanded = expandedCategories[cat.id] !== false;
            const clampedBarWidth = Math.min(100, Math.max(0, cat.percentageUsed));

            return (
              <div
                key={cat.id}
                className={`bg-[#161A23] rounded-3xl p-5 border transition-colors ${
                  cat.isOverspent ? 'border-red-500/40' : 'border-white/8'
                }`}
              >
                {/* Category Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        cat.isOverspent
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : cat.isSavings
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#FF6B2C]/15 border-[#FF6B2C]/30 text-[#FF6B2C]'
                      }`}
                    >
                      <DynamicIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {cat.name}
                        </h3>
                        <span className="text-xs text-neutral-500">·</span>
                        <span className="text-xs font-mono-tabular text-neutral-400">
                          {Math.round(cat.percentageUsed)}% used
                        </span>
                      </div>
                      <p className="text-xs font-mono-tabular text-neutral-400 mt-0.5">
                        {formatCurrency(cat.budget, currencySymbol)}{' '}
                        {cat.isSavings ? 'allocated' : 'budget'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenAddExpense(cat.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FF6B2C]/15 hover:bg-[#FF6B2C]/25 text-[#FF6B2C] text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Expense</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(cat.id)}
                      aria-label={`Toggle ${cat.name} subcategories`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Spent vs Remaining Row */}
                <div className="flex items-baseline justify-between gap-2 mb-2.5">
                  <div className="text-xs text-neutral-400">
                    <span className="font-mono-tabular font-semibold text-white text-sm">
                      {formatCurrency(cat.spent, currencySymbol)}
                    </span>{' '}
                    spent
                    <span className="text-neutral-600 mx-1.5">/</span>
                    <span className="font-mono-tabular">
                      {formatCurrency(cat.budget, currencySymbol)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-mono-tabular font-bold ${
                        cat.isOverspent ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(cat.remaining, currencySymbol)}
                    </span>{' '}
                    <span className="text-xs text-neutral-400">remaining</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#0B0D11] rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cat.isOverspent
                        ? 'bg-red-500'
                        : cat.isSavings
                        ? 'bg-emerald-500'
                        : cat.percentageUsed >= 85
                        ? 'bg-amber-500'
                        : 'bg-[#FF6B2C]'
                    }`}
                    style={{ width: `${clampedBarWidth}%` }}
                  />
                </div>

                {/* Overspending Warning Banner */}
                {cat.isOverspent && (
                  <div
                    role="alert"
                    className="mt-3 px-3.5 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2 text-xs text-red-300"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        Overspent in <strong>{cat.name}</strong>
                      </span>
                    </div>
                    <span className="font-mono-tabular font-bold text-red-400">
                      Overspent: {formatCurrency(cat.overspentAmount, currencySymbol)}
                    </span>
                  </div>
                )}

                {/* Subcategories Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/8 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400">
                        Subcategories ({cat.calculatedSubcategories.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartAddSub(cat.id)}
                        className="text-xs font-medium text-[#FF6B2C] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>
                    </div>

                    {/* Inline Add Subcategory Form */}
                    {addingSubToCat === cat.id && (
                      <div className="p-3.5 rounded-2xl bg-[#0B0D11] border border-white/10 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            placeholder="Subcategory name (e.g. Gym, Wifi)"
                            className="w-full px-3 py-2 bg-[#161A23] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6B2C]"
                          />
                          <div className="flex items-center gap-2">
                            {!newSubNoLimit && (
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-neutral-400">
                                  {currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={newSubLimit}
                                  onChange={(e) => setNewSubLimit(e.target.value)}
                                  placeholder="Limit"
                                  className="w-full pl-6 pr-2.5 py-2 bg-[#161A23] border border-white/10 rounded-xl text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF6B2C]"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setNewSubNoLimit((prev) => !prev)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                                newSubNoLimit
                                  ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                                  : 'bg-[#161A23] text-neutral-300 border-white/10'
                              }`}
                            >
                              No Limit
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAddingSubToCat(null)}
                            className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmAddSub(cat.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold"
                          >
                            Save Subcategory
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subcategory Rows */}
                    <div className="divide-y divide-white/6">
                      {cat.calculatedSubcategories.map((sub: CalculatedSubcategory) => {
                        const isEditingThis = editingSubId === sub.id;

                        if (isEditingThis) {
                          return (
                            <div
                              key={sub.id}
                              className="py-2.5 space-y-2.5 bg-[#0B0D11]/60 px-3 rounded-xl my-1"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editSubName}
                                  onChange={(e) => setEditSubName(e.target.value)}
                                  className="px-3 py-1.5 bg-[#161A23] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                                />
                                <div className="flex items-center gap-2">
                                  {!editSubNoLimit && (
                                    <input
                                      type="number"
                                      min="0"
                                      value={editSubLimit}
                                      onChange={(e) => setEditSubLimit(e.target.value)}
                                      placeholder="Limit amount"
                                      className="w-full px-3 py-1.5 bg-[#161A23] border border-white/10 rounded-xl text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF6B2C]"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setEditSubNoLimit((p) => !p)}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap ${
                                      editSubNoLimit
                                        ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                                        : 'bg-[#161A23] text-neutral-300 border-white/10'
                                    }`}
                                  >
                                    No Limit
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSubId(null)}
                                  className="p-1.5 text-neutral-400 hover:text-white"
                                  aria-label="Cancel subcategory edit"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmEditSub(cat.id, sub.id)}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300"
                                  aria-label="Save subcategory edit"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={sub.id}
                            className="py-2.5 flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-medium text-neutral-200 truncate">
                                    {sub.name}
                                  </span>
                                  {sub.isOverspent && (
                                    <span className="text-[11px] font-mono-tabular text-red-400">
                                      · Overspent {formatCurrency(sub.overspentAmount, currencySymbol)}
                                    </span>
                                  )}
                                  {!sub.isOverspent && sub.remaining !== null && (
                                    <span className="text-[11px] font-mono-tabular text-neutral-400">
                                      · {formatCurrency(sub.remaining, currencySymbol)} left
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs font-mono-tabular text-neutral-300 shrink-0">
                                  <span
                                    className={
                                      sub.isOverspent
                                        ? 'text-red-400 font-semibold'
                                        : 'text-white font-semibold'
                                    }
                                  >
                                    {formatCurrency(sub.spent, currencySymbol)}
                                  </span>{' '}
                                  <span className="text-neutral-500">/</span>{' '}
                                  <span className="text-neutral-400">
                                    {sub.limit !== null
                                      ? formatCurrency(sub.limit, currencySymbol)
                                      : 'No Limit'}
                                  </span>
                                </div>
                              </div>

                              {sub.limit !== null && sub.limit > 0 && (
                                <div className="w-full h-1 bg-[#0B0D11] rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className={`h-full rounded-full ${
                                      sub.isOverspent ? 'bg-red-500' : 'bg-white/30'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, sub.percentageUsed))}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Quick Subcategory Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenAddExpense(cat.id, sub.id)}
                                title={`Log ${sub.name} expense`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-[#FF6B2C] hover:bg-white/5 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditSub(sub)}
                                title={`Edit ${sub.name}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSubcategory(cat.id, sub.id)}
                                title={`Delete ${sub.name}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
