import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Calculator,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Share2,
  Check,
} from 'lucide-react';
import type { ThemeMode } from '../utils/theme';

export type ViewType = 'refinancing' | 'standard' | 'twolayer';

interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  rateSource: 'live' | 'fallback' | 'partial';
  isLoadingRates: boolean;
  onRefreshRates: () => void;
  lastUpdated: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  /** Share copies a URL forced to mode=report so recipients land in Report. */
  getShareableUrl?: () => string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  rateSource,
  isLoadingRates,
  onRefreshRates,
  lastUpdated,
  theme,
  onToggleTheme,
  getShareableUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const url = getShareableUrl ? getShareableUrl() : window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex max-w-6xl w-full min-w-0 items-center justify-between gap-1.5 sm:gap-3 px-3 py-2.5 sm:px-6">
        {/* Brand — shrinkable, long text never forces viewport width */}
        <div className="flex min-w-0 shrink items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
            %
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none font-mono truncate max-w-[12rem] md:max-w-none">
              realkredit.spacepope.dk
            </h1>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex min-w-0 flex-1 sm:flex-none items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[11px] sm:text-sm font-medium overflow-hidden">
          <button
            onClick={() => onSelectView('refinancing')}
            className={`flex min-w-0 items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-all ${
              currentView === 'refinancing'
                ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Låneomlægning</span>
            <span className="sm:hidden truncate">Omlæg</span>
          </button>

          <button
            onClick={() => onSelectView('standard')}
            className={`flex min-w-0 items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-all ${
              currentView === 'standard'
                ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Standardlån</span>
            <span className="sm:hidden truncate">Std</span>
          </button>

          <button
            onClick={() => onSelectView('twolayer')}
            className={`flex min-w-0 items-center gap-0.5 sm:gap-1 rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-all ${
              currentView === 'twolayer'
                ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">To-lags belåning</span>
            <span className="sm:hidden truncate">2-lag</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 rounded-lg border p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium transition-all ${
              copied
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
            title="Kopiér direkte link til denne beregning"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />}
            <span className="hidden lg:inline">{copied ? 'Link kopieret!' : 'Del'}</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            title={`Skift tema (aktuel: ${theme === 'dark' ? 'mørk' : theme === 'light' ? 'lys' : 'system'})`}
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-blue-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                rateSource === 'live'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                  : rateSource === 'partial'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              {rateSource === 'live' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className={`h-3.5 w-3.5 ${rateSource === 'partial' ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`} />
              )}
              <span>
                {rateSource === 'live'
                  ? `Live (${lastUpdated})`
                  : rateSource === 'partial'
                    ? `Delvist live (${lastUpdated})`
                    : `Snapshot fra ${lastUpdated}`}
              </span>
            </div>

            <button
              onClick={onRefreshRates}
              disabled={isLoadingRates}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
              title="Genindlæs obligationskurser"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRates ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
