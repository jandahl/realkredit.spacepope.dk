import React, { useState, useEffect, useId } from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helpText?: string;
  showSlider?: boolean;
  /** Extra work after min/max clamp on blur (e.g. LTV sibling clamps). */
  onBlurValue?: (clampedValue: number) => void;
  /** Visual + a11y error state (red frame). */
  error?: boolean;
  /** Danish callout shown under the field when error. */
  errorMessage?: string;
  /** Stable id on the wrapper for toast anchor links. */
  fieldId?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 20_000_000,
  step = 50_000,
  suffix = 'kr.',
  helpText,
  showSlider = false,
  onBlurValue,
  error = false,
  errorMessage,
  fieldId,
}) => {
  const reactId = useId();
  const inputId = fieldId ? `${fieldId}-input` : reactId;
  const [displayValue, setDisplayValue] = useState(value.toLocaleString('da-DK'));

  useEffect(() => {
    setDisplayValue(value.toLocaleString('da-DK'));
  }, [value]);

  const clamp = (num: number) => Math.min(max, Math.max(min, num));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setDisplayValue(num.toLocaleString('da-DK'));
    onChange(num);
  };

  const handleBlur = () => {
    const clamped = clamp(value);
    if (clamped !== value) {
      onChange(clamped);
    }
    setDisplayValue(clamped.toLocaleString('da-DK'));
    onBlurValue?.(clamped);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = clamp(parseInt(e.target.value, 10));
    onChange(num);
  };

  return (
    <div id={fieldId} className="flex flex-col gap-1 min-w-0">
      <div className="flex justify-between items-center gap-2 min-w-0">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {label}
        </label>
        {helpText && (
          <span
            className={`text-xs shrink-0 ${
              error ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {helpText}
          </span>
        )}
      </div>

      <div className="relative rounded-lg shadow-xs min-w-0">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          aria-invalid={error || undefined}
          aria-describedby={error && errorMessage ? `${inputId}-error` : undefined}
          className={`w-full min-w-0 rounded-lg border bg-white px-3 py-1.5 pr-12 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 transition-colors ${
            error
              ? 'border-rose-500 ring-2 ring-rose-500/30 focus:border-rose-500 focus:ring-rose-500/40 dark:border-rose-500'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400'
          }`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{suffix}</span>
        </div>
      </div>

      {error && errorMessage && (
        <p id={`${inputId}-error`} className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-snug">
          {errorMessage}
        </p>
      )}

      {showSlider && max > min && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamp(value)}
          onChange={handleSliderChange}
          aria-label={label}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
        />
      )}
    </div>
  );
};
