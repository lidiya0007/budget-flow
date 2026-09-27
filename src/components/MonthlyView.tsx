import React, { useState, useEffect } from 'react';
import { MonthlyDashboardMetrics } from '../types/budget';
import { formatCurrency } from '../utils/calculations';
import { DynamicIcon } from './IconPicker';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Pencil,
  Plus,
} from 'lucide-react';

interface MonthlyViewProps {
  metrics: MonthlyDashboardMetrics;
  currencySymbol: string;
  hasMonthOverride: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSetMonthlyIncomeOverride: (monthKey: string, income: number | undefined) => void;
  onOpenAddExpense: (categoryId?: string, subcategoryId?: string) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  metrics,
  currencySymbol,
  hasMonthOverride,
  onPrevMonth,
  onNextMonth,
  onSetMonthlyIncomeOverride,
  onOpenAddExpense,
}) => {
  const [isEditingMonthIncome, setIsEditingMonthIncome] = useState(false);
  const [monthIncomeInput, setMonthIncomeInput] = useState(String(metrics.monthlyIncome));

  useEffect(() => {
    setMonthIncomeInput(String(metrics.monthlyIncome));
    setIsEditingMonthIncome(false);
  }, [metrics.monthKey, metrics.monthlyIncome]);

  const handleSaveMonthIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.max(0, Number(monthIncomeInput) || 0);
    if (parsed > 0) {
      onSetMonthlyIncomeOverride(metrics.monthKey, parsed);
      setIsEditingMonthIncome(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Month Navigation Header */}
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
            Monthly Budget Allocation & Utilization Report
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

      {/* Monthly Overview Summary Card */}
      <section
        aria-label="Monthly Financial Summary"
        className="bg-[#161A23] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
          <div>
            <p className="text-xs font-semibold text-[#FF6B2C]">
              {metrics.monthLabel} Overview
            </p>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Monthly Cashflow Statement
            </h2>
          </div>

          {!isEditingMonthIncome ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingMonthIncome(true)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5 text-[#FF6B2C]" />
                <span>Edit {metrics.monthLabel} Income</span>
              </button>
              {hasMonthOverride && (
                <button
                  type="button"
                  onClick={() => onSetMonthlyIncomeOverride(metrics.monthKey, undefined)}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
                >
                  Use Default
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveMonthIncome} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-[#FF6B2C]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="1"
                  value={monthIncomeInput}
                  onChange={(e) => setMonthIncomeInput(e.target.value)}
                  className="w-32 pl-7 pr-3 py-2 bg-[#0B0D11] border border-white/15 rounded-xl text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>
              <button
                type="submit"
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          )}
        </div>

        {/* 5 Core Monthly Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0B0D11] border border-white/6 rounded-2xl p-3.5">
            <p className="text-xs text-neutral-400">Monthly Income</p>
            <p className="text-lg font-mono-tabular font-bold text-white mt-1">
              {formatCurrency(metrics.monthlyIncome, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11] border border-white/6 rounded-2xl p-3.5">
            <p className="text-xs text-neutral-400">Budgeted</p>
            <p className="text-lg font-mono-tabular font-bold text-white mt-1">
              {formatCurrency(metrics.totalAllocatedSpendingBudget, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11] border border-white/6 rounded-2xl p-3.5">
            <p className="text-xs text-neutral-400">Spent</p>
            <p className="text-lg font-mono-tabular font-bold text-[#FF6B2C] mt-1">
              {formatCurrency(metrics.totalAllExpenses, currencySymbol)}
            </p>
          </div>

          <div className="bg-[#0B0D11] border border-white/6 rounded-2xl p-3.5">
            <p className="text-xs text-neutral-400">Available to Spend</p>
            <p
              className={`text-lg font-mono-tabular font-bold mt-1 ${
                metrics.availableToSpend < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {formatCurrency(metrics.availableToSpend, currencySymbol)}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#0B0D11] border border-white/6 rounded-2xl p-3.5">
            <p className="text-xs text-neutral-400">Savings</p>
            <p className="text-lg font-mono-tabular font-bold text-emerald-400 mt-1">
              {formatCurrency(metrics.savingsRemaining, currencySymbol)}
            </p>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Income Allocation & Spending Balance</span>
            <span className="font-mono-tabular">
              Total Remaining (Incl. Savings):{' '}
              <strong className="text-emerald-400">
                {formatCurrency(metrics.totalRemainingIncludingSavings, currencySymbol)}
              </strong>
            </span>
          </div>

          <div className="w-full h-3 bg-[#0B0D11] rounded-full overflow-hidden flex border border-white/8">
            {metrics.calculatedCategories.map((cat) => {
              const sharePct =
                metrics.monthlyIncome > 0
                  ? Math.max(0, Math.min(100, (cat.budget / metrics.monthlyIncome) * 100))
                  : 0;
              return (
                <div
                  key={cat.id}
                  title={`${cat.name}: ${formatCurrency(cat.budget, currencySymbol)}`}
                  style={{ width: `${sharePct}%` }}
                  className={`h-full border-r border-[#0B0D11] last:border-r-0 ${
                    cat.isSavings
                      ? 'bg-emerald-500'
                      : cat.name.toLowerCase().includes('want')
                      ? 'bg-amber-500'
                      : 'bg-[#FF6B2C]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Category & Subcategory Breakdown Table */}
      <section aria-label="Monthly Category Breakdowns" className="space-y-4">
        <h2 className="text-lg font-bold text-white">Category Breakdowns</h2>

        {metrics.calculatedCategories.map((cat) => {
          const pctUsed = Math.min(100, Math.max(0, cat.percentageUsed));

          return (
            <div
              key={cat.id}
              className={`bg-[#161A23] rounded-3xl p-5 border ${
                cat.isOverspent ? 'border-red-500/40' : 'border-white/8'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
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
                    <h3 className="text-base font-bold text-white">{cat.name}</h3>
                    <p className="text-xs text-neutral-400 font-mono-tabular">
                      Budget: {formatCurrency(cat.budget, currencySymbol)} · Spent:{' '}
                      {formatCurrency(cat.spent, currencySymbol)} ({Math.round(cat.percentageUsed)}
                      %)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-base font-mono-tabular font-bold ${
                      cat.isOverspent ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(cat.remaining, currencySymbol)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {cat.isOverspent ? 'Overspent' : 'Remaining'}
                  </p>
                </div>
              </div>

              <div className="w-full h-2 bg-[#0B0D11] rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full ${
                    cat.isOverspent
                      ? 'bg-red-500'
                      : cat.isSavings
                      ? 'bg-emerald-500'
                      : 'bg-[#FF6B2C]'
                  }`}
                  style={{ width: `${pctUsed}%` }}
                />
              </div>

              {cat.isOverspent && (
                <div className="mb-4 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Exceeds monthly budget allocation</span>
                  </span>
                  <span className="font-mono-tabular font-bold text-red-400">
                    Overspent: {formatCurrency(cat.overspentAmount, currencySymbol)}
                  </span>
                </div>
              )}

              {/* Subcategory Ledger Rows */}
              <div className="divide-y divide-white/6 border-t border-white/8 pt-2">
                {cat.calculatedSubcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-neutral-200 truncate">
                        {sub.name}
                      </span>
                      {sub.remaining !== null && (
                        <span
                          className={`font-mono-tabular ${
                            sub.isOverspent ? 'text-red-400' : 'text-neutral-400'
                          }`}
                        >
                          ·{' '}
                          {sub.isOverspent
                            ? `Overspent ${formatCurrency(sub.overspentAmount, currencySymbol)}`
                            : `${formatCurrency(sub.remaining, currencySymbol)} remaining`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-tabular text-neutral-300">
                        <strong className="text-white">
                          {formatCurrency(sub.spent, currencySymbol)}
                        </strong>{' '}
                        /{' '}
                        {sub.limit !== null
                          ? formatCurrency(sub.limit, currencySymbol)
                          : 'No Limit'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onOpenAddExpense(cat.id, sub.id)}
                        className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg bg-[#0B0D11] border border-white/8 text-neutral-400 hover:text-[#FF6B2C] transition-colors"
                        title={`Add expense to ${sub.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
