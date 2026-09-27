import React, { useState } from 'react';
import { Category, MonthlyDashboardMetrics, Transaction } from '../types/budget';
import { formatCurrency } from '../utils/calculations';
import { DEFAULT_TODAY_STR, DEFAULT_YESTERDAY_STR } from '../utils/storage';
import { DynamicIcon, getSubcategoryIconName } from './IconPicker';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  Plus,
  Receipt,
} from 'lucide-react';

interface TransactionsViewProps {
  metrics: MonthlyDashboardMetrics;
  categories: Category[];
  currencySymbol: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenAddExpense: (categoryId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

function formatDateHeading(dateStr: string): string {
  if (dateStr === DEFAULT_TODAY_STR) return 'Today';
  if (dateStr === DEFAULT_YESTERDAY_STR) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  metrics,
  categories,
  currencySymbol,
  onPrevMonth,
  onNextMonth,
  onOpenAddExpense,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTransactions = metrics.monthTransactions.filter((tx) => {
    const matchesCat =
      selectedCategoryFilter === 'all' || tx.categoryId === selectedCategoryFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;
    const catName =
      categories.find((c) => c.id === tx.categoryId)?.name.toLowerCase() || '';
    const matchesSearch =
      tx.subcategoryName.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q)) ||
      catName.includes(q);
    return matchesCat && matchesSearch;
  });

  // Group chronologically by date
  const groupedByDate: { date: string; label: string; items: Transaction[]; dayTotal: number }[] =
    [];
  filteredTransactions.forEach((tx) => {
    let group = groupedByDate.find((g) => g.date === tx.date);
    if (!group) {
      group = {
        date: tx.date,
        label: formatDateHeading(tx.date),
        items: [],
        dayTotal: 0,
      };
      groupedByDate.push(group);
    }
    group.items.push(tx);
    group.dayTotal += tx.amount;
  });

  const filteredTotal = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Month Filter Header */}
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
            Transactions · {metrics.monthLabel}
          </h1>
          <p className="text-[11px] text-neutral-400">
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'record' : 'records'} · Total{' '}
            <span className="font-mono-tabular text-white font-semibold">
              {formatCurrency(filteredTotal, currencySymbol)}
            </span>
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

      {/* Category Filter Bar & Search */}
      <div className="bg-[#161A23] border border-white/8 rounded-3xl p-4 space-y-3">
        {/* Interactive Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#FF6B2C] text-white'
                : 'bg-[#0B0D11] text-neutral-400 hover:text-white border border-white/8'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const active = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#FF6B2C] text-white'
                    : 'bg-[#0B0D11] text-neutral-400 hover:text-white border border-white/8'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subcategory, category, or note..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B0D11] border border-white/8 focus:border-[#FF6B2C] rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Chronological Grouped List */}
      {groupedByDate.length === 0 ? (
        <div className="bg-[#161A23] border border-white/8 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B0D11] border border-white/8 flex items-center justify-center mx-auto text-neutral-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">No Expenses Found</h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Record an expense to automatically update your remaining category budgets and
              available spending balance.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenAddExpense(
                selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined
              )
            }
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#ff7d47] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Expense</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div
              key={group.date}
              className="bg-[#161A23] border border-white/8 rounded-3xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/8">
                <h2 className="text-sm font-bold text-white">{group.label}</h2>
                <span className="text-xs font-mono-tabular text-neutral-400">
                  Day Total:{' '}
                  <strong className="text-white">
                    {formatCurrency(group.dayTotal, currencySymbol)}
                  </strong>
                </span>
              </div>

              <div className="divide-y divide-white/6">
                {group.items.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const iconName = getSubcategoryIconName(
                    tx.subcategoryName,
                    cat?.icon || 'Wallet'
                  );

                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            cat?.isSavings
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-[#FF6B2C]/15 border-[#FF6B2C]/30 text-[#FF6B2C]'
                          }`}
                        >
                          <DynamicIcon name={iconName} className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {tx.subcategoryName}
                          </p>
                          {/* Clean unboxed metadata with typographic separators */}
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            <span>{cat?.name || 'Uncategorized'}</span>
                            {tx.note && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>{tx.note}</span>
                              </>
                            )}
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono-tabular">{tx.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base font-mono-tabular font-bold text-white mr-1">
                          {formatCurrency(tx.amount, currencySymbol)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          aria-label={`Edit ${tx.subcategoryName} transaction`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#0B0D11] border border-white/8 text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Delete ${tx.subcategoryName} transaction`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#0B0D11] border border-white/8 text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
