import React, { useState, useEffect } from 'react';
import { Category, Transaction } from '../types/budget';
import { DEFAULT_TODAY_STR } from '../utils/storage';
import { DynamicIcon } from './IconPicker';
import { X, Check, Plus, Calendar, FileText } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currencySymbol: string;
  activeMonthKey: string;
  initialCategoryId?: string;
  initialSubcategoryId?: string;
  editingTransaction?: Transaction | null;
  onSaveExpense: (data: {
    id?: string;
    amount: number;
    categoryId: string;
    subcategoryId: string;
    subcategoryName: string;
    note: string;
    date: string;
  }) => void;
  onQuickAddSubcategory: (categoryId: string, name: string) => string; // returns new subId
}

const QUICK_AMOUNTS = [50, 100, 150, 250, 500];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  currencySymbol,
  activeMonthKey,
  initialCategoryId,
  initialSubcategoryId,
  editingTransaction,
  onSaveExpense,
  onQuickAddSubcategory,
}) => {
  const defaultDateForMonth =
    activeMonthKey === DEFAULT_TODAY_STR.slice(0, 7)
      ? DEFAULT_TODAY_STR
      : `${activeMonthKey}-15`;

  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>(
    initialCategoryId || categories[0]?.id || 'cat-needs'
  );
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDateForMonth);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Inline quick subcategory creation inside modal
  const [isCreatingSub, setIsCreatingSub] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setIsCreatingSub(false);
    setNewSubName('');

    if (editingTransaction) {
      setAmountStr(String(editingTransaction.amount));
      setSelectedCatId(editingTransaction.categoryId);
      setSelectedSubId(editingTransaction.subcategoryId);
      setNote(editingTransaction.note || '');
      setDate(editingTransaction.date);
    } else {
      setAmountStr('');
      const targetCatId = initialCategoryId || categories[0]?.id || 'cat-needs';
      setSelectedCatId(targetCatId);
      const catObj = categories.find((c) => c.id === targetCatId) || categories[0];
      const targetSubId =
        initialSubcategoryId && catObj?.subcategories.some((s) => s.id === initialSubcategoryId)
          ? initialSubcategoryId
          : catObj?.subcategories[0]?.id || '';
      setSelectedSubId(targetSubId);
      setNote('');
      setDate(defaultDateForMonth);
    }
  }, [
    isOpen,
    editingTransaction,
    initialCategoryId,
    initialSubcategoryId,
    categories,
    defaultDateForMonth,
  ]);

  if (!isOpen) return null;

  const currentCategory =
    categories.find((c) => c.id === selectedCatId) || categories[0];

  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    const nextCat = categories.find((c) => c.id === catId);
    if (nextCat && nextCat.subcategories.length > 0) {
      setSelectedSubId(nextCat.subcategories[0].id);
    } else {
      setSelectedSubId('');
    }
  };

  const handleCreateQuickSub = () => {
    const trimmed = newSubName.trim();
    if (!trimmed || !currentCategory) return;
    const createdId = onQuickAddSubcategory(currentCategory.id, trimmed);
    setSelectedSubId(createdId);
    setIsCreatingSub(false);
    setNewSubName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!currentCategory) {
      setErrorMsg('Please select a category.');
      return;
    }

    const subObj = currentCategory.subcategories.find((s) => s.id === selectedSubId);
    const subName = subObj ? subObj.name : currentCategory.name;
    const subId = subObj ? subObj.id : 'sub-general';

    onSaveExpense({
      id: editingTransaction?.id,
      amount: numericAmount,
      categoryId: currentCategory.id,
      subcategoryId: subId,
      subcategoryName: subName,
      note: note.trim(),
      date: date || DEFAULT_TODAY_STR,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="w-full max-w-lg bg-[#161A23] border-t sm:border border-white/12 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Top Grab Handle on Mobile */}
        <div className="w-10 h-1.5 bg-white/15 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 id="expense-modal-title" className="text-lg font-bold text-white">
              {editingTransaction ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <p className="text-xs text-neutral-400">
              Instant deduction from your category & available spending balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Field */}
          <div>
            <label
              htmlFor="expense-amount-input"
              className="block text-xs font-medium text-neutral-300 mb-2"
            >
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-mono-tabular font-bold text-[#FF6B2C]">
                {currencySymbol}
              </span>
              <input
                id="expense-amount-input"
                type="number"
                min="0.01"
                step="any"
                autoFocus
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="250"
                className="w-full pl-11 pr-4 py-4 bg-[#0B0D11] border border-white/12 focus:border-[#FF6B2C] rounded-2xl text-2xl font-mono-tabular font-bold text-white placeholder-neutral-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmountStr(String(amt));
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0B0D11] hover:bg-white/10 border border-white/8 text-xs font-mono-tabular font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  {currencySymbol}
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector Buttons */}
          <div>
            <span className="block text-xs font-medium text-neutral-300 mb-2">
              Category
            </span>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCatId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`min-h-[46px] px-3 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-md shadow-[#FF6B2C]/20'
                        : 'bg-[#0B0D11] text-neutral-300 border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <DynamicIcon name={cat.icon} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="expense-subcategory-select"
                className="text-xs font-medium text-neutral-300"
              >
                Subcategory
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingSub((p) => !p)}
                className="text-xs font-medium text-[#FF6B2C] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Subcategory</span>
              </button>
            </div>

            {isCreatingSub ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Enter new subcategory name..."
                  className="flex-1 px-3.5 py-2.5 bg-[#0B0D11] border border-white/12 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                />
                <button
                  type="button"
                  onClick={handleCreateQuickSub}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            ) : null}

            {/* Interactive Subcategory Pills / Grid + Dropdown */}
            {currentCategory && currentCategory.subcategories.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  {currentCategory.subcategories.map((sub) => {
                    const active = sub.id === selectedSubId;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubId(sub.id)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-white text-[#0B0D11] border-white font-semibold'
                            : 'bg-[#0B0D11] text-neutral-300 border-white/10 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>

                <select
                  id="expense-subcategory-select"
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0B0D11] border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#FF6B2C]"
                >
                  {currentCategory.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}{' '}
                      {sub.limit !== null
                        ? `(Limit: ${currencySymbol}${sub.limit})`
                        : '(No Limit)'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 bg-[#0B0D11] p-3 rounded-xl border border-white/8">
                No subcategories yet. Click "New Subcategory" above or save directly under{' '}
                {currentCategory?.name}.
              </p>
            )}
          </div>

          {/* Note & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="expense-note-input"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Note (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="expense-note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lunch, Cab, Groceries"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#0B0D11] border border-white/10 focus:border-[#FF6B2C] rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="expense-date-input"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-[#0B0D11] border border-white/10 focus:border-[#FF6B2C] rounded-2xl text-sm font-mono-tabular text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs text-red-400 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] px-5 py-3 rounded-2xl bg-[#FF6B2C] hover:bg-[#ff7d47] text-white text-sm font-semibold shadow-lg shadow-[#FF6B2C]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
