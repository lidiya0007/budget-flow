import React, { useState, useEffect } from 'react';
import { Category, SplitMode, Subcategory } from '../types/budget';
import { formatCurrency } from '../utils/calculations';
import { AVAILABLE_ICONS, DynamicIcon } from './IconPicker';
import {
  Sliders,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Wand2,
} from 'lucide-react';

interface SettingsViewProps {
  monthlyIncome: number;
  splitMode: SplitMode;
  includeSavingsInAvailable: boolean;
  categories: Category[];
  currencySymbol: string;
  onUpdateBudgetSplit: (
    newIncome: number,
    newSplitMode: SplitMode,
    updatedCategories: Category[]
  ) => void;
  onToggleIncludeSavings: (include: boolean) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (categoryId: string, name: string, limit: number | null) => void;
  onUpdateSubcategory: (
    categoryId: string,
    subcategoryId: string,
    name: string,
    limit: number | null
  ) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onOpenSetupWizard: () => void;
  onResetToDemo: () => void;
}

const PRESETS: { label: string; values: [number, number, number] }[] = [
  { label: '50 / 30 / 20', values: [50, 30, 20] },
  { label: '60 / 20 / 20', values: [60, 20, 20] },
  { label: '70 / 20 / 10', values: [70, 20, 10] },
  { label: '40 / 30 / 30', values: [40, 30, 30] },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  monthlyIncome,
  splitMode,
  includeSavingsInAvailable,
  categories,
  currencySymbol,
  onUpdateBudgetSplit,
  onToggleIncludeSavings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onOpenSetupWizard,
  onResetToDemo,
}) => {
  const [isAdjustingSplit, setIsAdjustingSplit] = useState<boolean>(true);
  const [draftIncome, setDraftIncome] = useState<string>(String(monthlyIncome));
  const [draftMode, setDraftMode] = useState<SplitMode>(splitMode);
  const [draftPercentages, setDraftPercentages] = useState<Record<string, number>>({});
  const [draftFixedAmounts, setDraftFixedAmounts] = useState<Record<string, number>>({});
  const [splitSavedNotice, setSplitSavedNotice] = useState<boolean>(false);

  // Add Category state
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('Wallet');
  const [newCatIsSavings, setNewCatIsSavings] = useState<boolean>(false);

  // Edit Category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState<string>('');
  const [editCatIcon, setEditCatIcon] = useState<string>('Wallet');
  const [editCatIsSavings, setEditCatIsSavings] = useState<boolean>(false);

  // Add Subcategory state inside Manage Categories
  const [addingSubToCatId, setAddingSubToCatId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubLimit, setNewSubLimit] = useState<string>('150');
  const [newSubNoLimit, setNewSubNoLimit] = useState<boolean>(false);

  // Edit Subcategory state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState<string>('');
  const [editSubLimit, setEditSubLimit] = useState<string>('');
  const [editSubNoLimit, setEditSubNoLimit] = useState<boolean>(false);

  useEffect(() => {
    setDraftIncome(String(monthlyIncome));
    setDraftMode(splitMode);
    const pctMap: Record<string, number> = {};
    const fixMap: Record<string, number> = {};
    categories.forEach((c) => {
      pctMap[c.id] = c.percentage;
      fixMap[c.id] = c.fixedAmount;
    });
    setDraftPercentages(pctMap);
    setDraftFixedAmounts(fixMap);
  }, [monthlyIncome, splitMode, categories]);

  const parsedIncome = Math.max(0, Number(draftIncome) || 0);

  const totalPercentage = categories.reduce(
    (sum, c) => sum + (Number(draftPercentages[c.id]) || 0),
    0
  );
  const totalFixed = categories.reduce(
    (sum, c) => sum + (Number(draftFixedAmounts[c.id]) || 0),
    0
  );

  const isPercentageValid = Math.round(totalPercentage) === 100 && parsedIncome > 0;
  const isFixedValid = totalFixed > 0;

  const handleApplyPreset = (values: [number, number, number]) => {
    setDraftMode('percentage');
    if (categories.length >= 3) {
      const nextPct: Record<string, number> = { ...draftPercentages };
      const nextFix: Record<string, number> = { ...draftFixedAmounts };
      nextPct[categories[0].id] = values[0];
      nextPct[categories[1].id] = values[1];
      nextPct[categories[2].id] = values[2];
      nextFix[categories[0].id] = Math.round((parsedIncome * values[0]) / 100);
      nextFix[categories[1].id] = Math.round((parsedIncome * values[1]) / 100);
      nextFix[categories[2].id] = Math.round((parsedIncome * values[2]) / 100);
      for (let i = 3; i < categories.length; i++) {
        nextPct[categories[i].id] = 0;
        nextFix[categories[i].id] = 0;
      }
      setDraftPercentages(nextPct);
      setDraftFixedAmounts(nextFix);
    }
  };

  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftMode === 'percentage' && !isPercentageValid) return;
    if (draftMode === 'fixed' && !isFixedValid) return;

    const effectiveIncome = draftMode === 'fixed' ? totalFixed : parsedIncome;

    const updatedCategories = categories.map((cat) => {
      if (draftMode === 'percentage') {
        const pct = Number(draftPercentages[cat.id]) || 0;
        return {
          ...cat,
          percentage: pct,
          fixedAmount: Math.round((effectiveIncome * pct) / 100),
        };
      } else {
        const fix = Math.max(0, Number(draftFixedAmounts[cat.id]) || 0);
        const pct = effectiveIncome > 0 ? Math.round((fix / effectiveIncome) * 100) : 0;
        return {
          ...cat,
          fixedAmount: fix,
          percentage: pct,
        };
      }
    });

    onUpdateBudgetSplit(effectiveIncome, draftMode, updatedCategories);
    setSplitSavedNotice(true);
    setTimeout(() => setSplitSavedNotice(false), 2500);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    onAddCategory({
      name: trimmed,
      icon: newCatIcon,
      percentage: 0,
      fixedAmount: 0,
      isSavings: newCatIsSavings,
      color: newCatIsSavings ? 'emerald' : 'orange',
      subcategories: [
        {
          id: `sub-${Date.now()}`,
          name: `${trimmed} General`,
          limit: null,
          icon: newCatIcon,
        },
      ],
    });
    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
    setEditCatIsSavings(cat.isSavings);
  };

  const handleSaveEditCategory = (catId: string) => {
    const trimmed = editCatName.trim();
    if (!trimmed) return;
    onUpdateCategory(catId, {
      name: trimmed,
      icon: editCatIcon,
      isSavings: editCatIsSavings,
    });
    setEditingCatId(null);
  };

  const handleStartEditSub = (sub: Subcategory) => {
    setEditingSubId(sub.id);
    setEditSubName(sub.name);
    setEditSubNoLimit(sub.limit === null);
    setEditSubLimit(sub.limit !== null ? String(sub.limit) : '');
  };

  const handleSaveEditSub = (catId: string, subId: string) => {
    const trimmed = editSubName.trim();
    if (!trimmed) return;
    const limitVal = editSubNoLimit ? null : Math.max(0, Number(editSubLimit) || 0);
    onUpdateSubcategory(catId, subId, trimmed, limitVal);
    setEditingSubId(null);
  };

  const handleConfirmAddSub = (catId: string) => {
    const trimmed = newSubName.trim();
    if (!trimmed) return;
    const limitVal = newSubNoLimit ? null : Math.max(0, Number(newSubLimit) || 0);
    onAddSubcategory(catId, trimmed, limitVal);
    setAddingSubToCatId(null);
    setNewSubName('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* SECTION 1: BUDGET SPLIT */}
      <section
        aria-label="Budget Split Settings"
        className="bg-[#161A23] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#FF6B2C]">Budget Allocation</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Budget Split</h1>
          </div>

          <button
            type="button"
            onClick={() => setIsAdjustingSplit((p) => !p)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Adjust Split</span>
          </button>
        </div>

        {/* Summary Row of Current Split */}
        <div className="grid grid-cols-3 gap-2.5">
          {categories.map((cat) => {
            const amount =
              splitMode === 'percentage'
                ? Math.round((monthlyIncome * cat.percentage) / 100)
                : cat.fixedAmount;
            return (
              <div
                key={cat.id}
                className="bg-[#0B0D11] border border-white/6 rounded-2xl p-3"
              >
                <p className="text-xs text-neutral-400 truncate">{cat.name}</p>
                <p className="text-base font-mono-tabular font-bold text-white mt-0.5">
                  {cat.percentage}%
                </p>
                <p className="text-xs font-mono-tabular text-[#FF6B2C] mt-0.5">
                  {formatCurrency(amount, currencySymbol)}
                </p>
              </div>
            );
          })}
        </div>

        {isAdjustingSplit && (
          <form
            onSubmit={handleSaveSplit}
            className="space-y-4 pt-4 border-t border-white/8"
          >
            {/* Mode Switcher: Percentage Mode vs Fixed Amount Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-medium text-neutral-300">
                Allocation Method
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#0B0D11] rounded-xl border border-white/8">
                <button
                  type="button"
                  onClick={() => setDraftMode('percentage')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    draftMode === 'percentage'
                      ? 'bg-[#FF6B2C] text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Percentage Mode (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDraftMode('fixed')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    draftMode === 'fixed'
                      ? 'bg-[#FF6B2C] text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Fixed Amount Mode ({currencySymbol})
                </button>
              </div>
            </div>

            {/* Monthly Take-Home Income Input */}
            <div>
              <label
                htmlFor="settings-income-input"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Monthly Take-Home Income
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-mono-tabular font-bold text-[#FF6B2C]">
                  {currencySymbol}
                </span>
                <input
                  id="settings-income-input"
                  type="number"
                  min="1"
                  value={draftIncome}
                  onChange={(e) => setDraftIncome(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#0B0D11] border border-white/10 focus:border-[#FF6B2C] rounded-2xl text-base font-mono-tabular font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Presets in Percentage Mode */}
            {draftMode === 'percentage' && (
              <div>
                <span className="block text-xs text-neutral-400 mb-2">
                  Quick Split Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyPreset(preset.values)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0D11] hover:bg-white/10 border border-white/10 text-xs font-mono-tabular font-semibold text-neutral-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Split Rows */}
            <div className="bg-[#0B0D11] border border-white/8 rounded-2xl p-4 space-y-3">
              {categories.map((cat) => {
                const pct = Number(draftPercentages[cat.id]) || 0;
                const fix = Number(draftFixedAmounts[cat.id]) || 0;
                const previewAmt =
                  draftMode === 'percentage'
                    ? Math.round((parsedIncome * pct) / 100)
                    : fix;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 py-1.5 border-b border-white/6 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{cat.name}</p>
                      <p className="text-xs font-mono-tabular text-neutral-400">
                        {draftMode === 'percentage'
                          ? `${formatCurrency(previewAmt, currencySymbol)}`
                          : `${
                              totalFixed > 0 ? Math.round((fix / totalFixed) * 100) : 0
                            }% of total`}
                      </p>
                    </div>

                    {draftMode === 'percentage' ? (
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) =>
                            setDraftPercentages((prev) => ({
                              ...prev,
                              [cat.id]: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="w-full pl-3 pr-7 py-2 bg-[#161A23] border border-white/12 focus:border-[#FF6B2C] rounded-xl text-right font-mono-tabular text-sm font-bold text-white focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-neutral-400">
                          %
                        </span>
                      </div>
                    ) : (
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-neutral-400">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={fix}
                          onChange={(e) =>
                            setDraftFixedAmounts((prev) => ({
                              ...prev,
                              [cat.id]: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="w-full pl-7 pr-3 py-2 bg-[#161A23] border border-white/12 focus:border-[#FF6B2C] rounded-xl text-right font-mono-tabular text-sm font-bold text-white focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 flex items-center justify-between text-xs font-mono-tabular">
                <span className="text-neutral-400">Total Allocation</span>
                {draftMode === 'percentage' ? (
                  <span
                    className={`font-bold ${
                      Math.round(totalPercentage) === 100
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {totalPercentage}% / 100%
                  </span>
                ) : (
                  <span className="font-bold text-emerald-400">
                    Total = {formatCurrency(totalFixed, currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            {draftMode === 'percentage' && Math.round(totalPercentage) !== 100 && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Percentages currently total <strong>{totalPercentage}%</strong>. They must
                  total exactly <strong>100%</strong> to save.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {splitSavedNotice ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Budget split updated!</span>
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={
                  draftMode === 'percentage' ? !isPercentageValid : !isFixedValid
                }
                className={`min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  (draftMode === 'percentage' ? isPercentageValid : isFixedValid)
                    ? 'bg-[#FF6B2C] hover:bg-[#ff7d47] text-white cursor-pointer'
                    : 'bg-white/5 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Save Budget Split</span>
              </button>
            </div>
          </form>
        )}

        {/* Savings Protection Toggle */}
        <div className="pt-4 border-t border-white/8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Include Savings in "Available to Spend"
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              By default, Savings is protected and excluded from Available to Spend.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={includeSavingsInAvailable}
            onClick={() => onToggleIncludeSavings(!includeSavingsInAvailable)}
            className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
              includeSavingsInAvailable ? 'bg-[#FF6B2C]' : 'bg-[#0B0D11] border border-white/15'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                includeSavingsInAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* SECTION 2: MANAGE CATEGORIES & SUBCATEGORIES */}
      <section
        aria-label="Manage Categories"
        className="bg-[#161A23] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#FF6B2C]">Custom Budgeting System</p>
            <h2 className="text-xl font-bold text-white mt-0.5">Manage Categories</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCategory((p) => !p)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#ff7d47] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add New Category Form */}
        {showAddCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="p-4 rounded-2xl bg-[#0B0D11] border border-white/12 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">Create New Main Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Debt Payoff, Side Hustle, Family"
                  className="w-full px-3.5 py-2.5 bg-[#161A23] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Category Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatIsSavings(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                      !newCatIsSavings
                        ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                        : 'bg-[#161A23] text-neutral-300 border-white/10'
                    }`}
                  >
                    Spending
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatIsSavings(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                      newCatIsSavings
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-[#161A23] text-neutral-300 border-white/10'
                    }`}
                  >
                    Savings
                  </button>
                </div>
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">
                Choose Category Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_ICONS.slice(0, 14).map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setNewCatIcon(ic.name)}
                    title={ic.label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                      newCatIcon === ic.name
                        ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                        : 'bg-[#161A23] text-neutral-400 border-white/8 hover:text-white'
                    }`}
                  >
                    <DynamicIcon name={ic.name} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold"
              >
                Create Category
              </button>
            </div>
          </form>
        )}

        {/* Categories & Subcategories List */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const isEditingCat = editingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="bg-[#0B0D11] border border-white/8 rounded-2xl p-4 space-y-3"
              >
                {/* Category Header or Edit Row */}
                {isEditingCat ? (
                  <div className="space-y-3 pb-3 border-b border-white/8">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#161A23] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                      />
                      <button
                        type="button"
                        onClick={() => setEditCatIsSavings((p) => !p)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border ${
                          editCatIsSavings
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-[#161A23] text-neutral-300 border-white/10'
                        }`}
                      >
                        {editCatIsSavings ? 'Savings Category' : 'Spending Category'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(cat.id)}
                        className="px-3 py-2 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-2.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_ICONS.slice(0, 14).map((ic) => (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setEditCatIcon(ic.name)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            editCatIcon === ic.name
                              ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                              : 'bg-[#161A23] text-neutral-400 border-white/8'
                          }`}
                        >
                          <DynamicIcon name={ic.name} className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#161A23] border border-white/10 flex items-center justify-center text-[#FF6B2C]">
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                        <p className="text-[11px] text-neutral-400">
                          {cat.isSavings ? 'Savings Allocation' : 'Spending Budget'} ·{' '}
                          {cat.subcategories.length} subcategories
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAddingSubToCatId(cat.id)}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#FF6B2C] font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subcategory</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(cat)}
                        aria-label={`Edit ${cat.name}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          aria-label={`Delete ${cat.name}`}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Subcategory Inline Form */}
                {addingSubToCatId === cat.id && (
                  <div className="p-3 rounded-xl bg-[#161A23] border border-white/10 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="New subcategory name"
                        className="px-3 py-2 bg-[#0B0D11] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                      />
                      <div className="flex items-center gap-2">
                        {!newSubNoLimit && (
                          <input
                            type="number"
                            min="0"
                            value={newSubLimit}
                            onChange={(e) => setNewSubLimit(e.target.value)}
                            placeholder="Limit"
                            className="w-full px-3 py-2 bg-[#0B0D11] border border-white/10 rounded-xl text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF6B2C]"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewSubNoLimit((p) => !p)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border whitespace-nowrap ${
                            newSubNoLimit
                              ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                              : 'bg-[#0B0D11] text-neutral-300 border-white/10'
                          }`}
                        >
                          No Limit
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingSubToCatId(null)}
                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAddSub(cat.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-semibold"
                      >
                        Add Subcategory
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategory List */}
                <div className="divide-y divide-white/6">
                  {cat.subcategories.map((sub) => {
                    const isEditingSub = editingSubId === sub.id;

                    if (isEditingSub) {
                      return (
                        <div key={sub.id} className="py-2 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                            className="flex-1 min-w-[120px] px-3 py-1.5 bg-[#161A23] border border-white/15 rounded-xl text-xs text-white"
                          />
                          {!editSubNoLimit && (
                            <input
                              type="number"
                              min="0"
                              value={editSubLimit}
                              onChange={(e) => setEditSubLimit(e.target.value)}
                              placeholder="Limit"
                              className="w-24 px-3 py-1.5 bg-[#161A23] border border-white/15 rounded-xl text-xs font-mono-tabular text-white"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setEditSubNoLimit((p) => !p)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs border ${
                              editSubNoLimit
                                ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                                : 'bg-[#161A23] text-neutral-300 border-white/10'
                            }`}
                          >
                            No Limit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditSub(cat.id, sub.id)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubId(null)}
                            className="p-1.5 text-neutral-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={sub.id}
                        className="py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-neutral-200 font-medium">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tabular text-neutral-400">
                            {sub.limit !== null
                              ? `Limit: ${formatCurrency(sub.limit, currencySymbol)}`
                              : 'No Limit'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditSub(sub)}
                            aria-label={`Edit subcategory ${sub.name}`}
                            className="p-1.5 text-neutral-500 hover:text-white"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSubcategory(cat.id, sub.id)}
                            aria-label={`Delete subcategory ${sub.name}`}
                            className="p-1.5 text-neutral-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: QUICK SETUP & DEMO CONTROLS */}
      <section
        aria-label="Setup and Demo Data"
        className="bg-[#161A23] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 className="text-base font-bold text-white">Setup Wizard & Demo Data</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Re-run the first-time setup flow or restore the initial demo dataset ({currencySymbol}
            1,600 monthly income).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onOpenSetupWizard}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Wand2 className="w-4 h-4 text-[#FF6B2C]" />
            <span>Open First-Time Setup</span>
          </button>

          <button
            type="button"
            onClick={onResetToDemo}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#FF6B2C]" />
            <span>Restore Demo Data ({currencySymbol}1,600)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
