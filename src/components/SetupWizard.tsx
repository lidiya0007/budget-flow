import React, { useState, useEffect } from 'react';
import { Category } from '../types/budget';
import { formatCurrency } from '../utils/calculations';
import { Check, AlertTriangle, Sparkles, Sliders, X } from 'lucide-react';

interface SetupWizardProps {
  initialIncome: number;
  categories: Category[];
  currencySymbol: string;
  onSaveSetup: (income: number, updatedCategories: Category[]) => void;
  onLoadDemo: () => void;
  onDismiss?: () => void;
  isExpandedModal?: boolean;
}

interface PresetOption {
  label: string;
  values: [number, number, number];
}

const PRESETS: PresetOption[] = [
  { label: '50 / 30 / 20', values: [50, 30, 20] },
  { label: '60 / 20 / 20', values: [60, 20, 20] },
  { label: '70 / 20 / 10', values: [70, 20, 10] },
  { label: '40 / 30 / 30', values: [40, 30, 30] },
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  initialIncome,
  categories,
  currencySymbol,
  onSaveSetup,
  onLoadDemo,
  onDismiss,
  isExpandedModal = false,
}) => {
  const [incomeInput, setIncomeInput] = useState<string>(String(initialIncome || 1600));
  const [activePreset, setActivePreset] = useState<string>('50 / 30 / 20');
  const [draftPercentages, setDraftPercentages] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    categories.forEach((c) => {
      map[c.id] = c.percentage;
    });
    return map;
  });

  useEffect(() => {
    setIncomeInput(String(initialIncome || 1600));
    const map: Record<string, number> = {};
    categories.forEach((c) => {
      map[c.id] = c.percentage;
    });
    setDraftPercentages(map);

    if (categories.length === 3) {
      const p0 = categories[0].percentage;
      const p1 = categories[1].percentage;
      const p2 = categories[2].percentage;
      const match = PRESETS.find(
        (pr) => pr.values[0] === p0 && pr.values[1] === p1 && pr.values[2] === p2
      );
      setActivePreset(match ? match.label : 'Custom');
    } else {
      setActivePreset('Custom');
    }
  }, [initialIncome, categories]);

  const parsedIncome = Math.max(0, Number(incomeInput) || 0);

  const totalPercentage = categories.reduce(
    (sum, cat) => sum + (Number(draftPercentages[cat.id]) || 0),
    0
  );
  const isValidTotal = Math.round(totalPercentage) === 100 && parsedIncome > 0;

  const handleApplyPreset = (preset: PresetOption) => {
    setActivePreset(preset.label);
    if (categories.length >= 3) {
      const next: Record<string, number> = { ...draftPercentages };
      next[categories[0].id] = preset.values[0];
      next[categories[1].id] = preset.values[1];
      next[categories[2].id] = preset.values[2];
      // Set any extra custom categories to 0 when applying standard 3-way preset
      for (let i = 3; i < categories.length; i++) {
        next[categories[i].id] = 0;
      }
      setDraftPercentages(next);
    }
  };

  const handlePercentageChange = (catId: string, valStr: string) => {
    setActivePreset('Custom');
    const num = Math.max(0, Math.min(100, Number(valStr) || 0));
    setDraftPercentages((prev) => ({
      ...prev,
      [catId]: num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTotal) return;

    const updated = categories.map((cat) => {
      const pct = Number(draftPercentages[cat.id]) || 0;
      return {
        ...cat,
        percentage: pct,
        fixedAmount: Math.round((parsedIncome * pct) / 100),
      };
    });
    onSaveSetup(parsedIncome, updated);
  };

  return (
    <section
      aria-label="First-Time Budget Setup"
      className={`bg-[#161A23] border border-white/10 rounded-3xl p-5 sm:p-6 transition-all ${
        isExpandedModal ? 'shadow-2xl' : 'mb-6'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-[#FF6B2C] tracking-wide mb-1">
            Quick Budget Configuration
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome to BudgetFlow
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Take control of your money.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close setup wizard"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Monthly Take-Home Income */}
        <div>
          <label
            htmlFor="setup-monthly-income"
            className="block text-xs font-medium text-neutral-300 mb-2"
          >
            Monthly Take-Home Income
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-lg font-mono-tabular font-semibold text-[#FF6B2C]">
              {currencySymbol}
            </span>
            <input
              id="setup-monthly-income"
              type="number"
              min="1"
              step="any"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="1600"
              className="w-full pl-10 pr-28 py-3.5 bg-[#0B0D11] border border-white/10 focus:border-[#FF6B2C] rounded-2xl text-xl font-mono-tabular font-semibold text-white placeholder-neutral-600 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setIncomeInput('1600')}
              className="absolute right-2.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap"
            >
              Ex: {currencySymbol}1600
            </button>
          </div>
        </div>

        {/* Step 2: Preset Ratios & Custom Split */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-300">
              Choose Budget Split Ratio (Needs / Wants / Savings)
            </span>
            <span
              className={`text-xs font-mono-tabular font-semibold ${
                Math.round(totalPercentage) === 100 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              Total: {totalPercentage}%
            </span>
          </div>

          {/* Preset Selector Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {PRESETS.map((preset) => {
              const isSelected = activePreset === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-mono-tabular font-semibold transition-colors whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                      : 'bg-[#0B0D11] text-neutral-300 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActivePreset('Custom')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap border flex items-center justify-center gap-1.5 ${
                activePreset === 'Custom'
                  ? 'bg-[#FF6B2C] text-white border-[#FF6B2C]'
                  : 'bg-[#0B0D11] text-neutral-300 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Live Preview & Editable Category Percentages */}
          <div className="bg-[#0B0D11] border border-white/8 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/8">
              <span className="text-xs text-neutral-400">Monthly Income</span>
              <span className="text-sm font-mono-tabular font-bold text-white">
                {formatCurrency(parsedIncome, currencySymbol)}
              </span>
            </div>

            {categories.map((cat) => {
              const pct = Number(draftPercentages[cat.id]) || 0;
              const allocatedAmt = Math.round((parsedIncome * pct) / 100);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-3 py-1"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs text-neutral-500">·</span>
                      <span
                        className={`text-sm font-mono-tabular font-semibold ${
                          cat.isSavings ? 'text-emerald-400' : 'text-[#FF6B2C]'
                        }`}
                      >
                        {formatCurrency(allocatedAmt, currencySymbol)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pct}
                      aria-label={`${cat.name} percentage slider`}
                      onChange={(e) => handlePercentageChange(cat.id, e.target.value)}
                      className="hidden sm:block w-24 accent-[#FF6B2C] cursor-pointer"
                    />
                    <div className="relative w-20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pct}
                        aria-label={`${cat.name} percentage`}
                        onChange={(e) => handlePercentageChange(cat.id, e.target.value)}
                        className="w-full pl-3 pr-7 py-1.5 bg-[#161A23] border border-white/10 focus:border-[#FF6B2C] rounded-xl text-right font-mono-tabular text-sm font-semibold text-white focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-neutral-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Error Message if not 100% */}
        {Math.round(totalPercentage) !== 100 && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Your category split currently totals{' '}
              <strong className="font-mono-tabular">{totalPercentage}%</strong>. Percentages must
              total exactly <strong className="font-mono-tabular">100%</strong> before saving.
            </span>
          </div>
        )}

        {parsedIncome <= 0 && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Please enter a monthly take-home income greater than 0.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <button
            type="submit"
            disabled={!isValidTotal}
            className={`flex-1 min-h-[48px] px-5 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              isValidTotal
                ? 'bg-[#FF6B2C] hover:bg-[#ff7d47] text-white shadow-lg shadow-[#FF6B2C]/20 cursor-pointer active:scale-[0.99]'
                : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Set Budget</span>
          </button>

          <button
            type="button"
            onClick={onLoadDemo}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#FF6B2C]" />
            <span>Reset Demo ({currencySymbol}1,600)</span>
          </button>
        </div>
      </form>
    </section>
  );
};
