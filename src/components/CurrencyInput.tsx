import React, { useState, useEffect } from 'react';

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
}) => {
  const [displayValue, setDisplayValue] = useState(value.toLocaleString('da-DK'));

  useEffect(() => {
    setDisplayValue(value.toLocaleString('da-DK'));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setDisplayValue(num.toLocaleString('da-DK'));
    onChange(num);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    onChange(num);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {helpText && <span className="text-xs text-slate-500 dark:text-slate-400">{helpText}</span>}
      </div>

      <div className="relative rounded-lg shadow-xs">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-12 text-base font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400 transition-colors"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{suffix}</span>
        </div>
      </div>

      {showSlider && max > min && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
        />
      )}
    </div>
  );
};
