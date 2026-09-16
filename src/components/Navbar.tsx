import React from 'react';
import { ArrowLeftRight, Calculator, Layers, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export type ViewType = 'refinancing' | 'standard' | 'twolayer';

interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  rateSource: 'live' | 'fallback';
  isLoadingRates: boolean;
  onRefreshRates: () => void;
  lastUpdated: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  rateSource,
  isLoadingRates,
  onRefreshRates,
  lastUpdated,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-sm">
            %
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              Realkredit<span className="text-blue-600">.dk</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Dansk Realkredit- & Konverteringsberegner</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center rounded-xl bg-slate-100 p-1 text-sm font-medium">
          <button
            onClick={() => onSelectView('refinancing')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              currentView === 'refinancing'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
            <span>Låneomlægning</span>
          </button>

          <button
            onClick={() => onSelectView('standard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              currentView === 'standard'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="h-4 w-4 text-blue-600" />
            <span>Standard lån</span>
          </button>

          <button
            onClick={() => onSelectView('twolayer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              currentView === 'twolayer'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4 text-blue-600" />
            <span>To-lags belåning</span>
          </button>
        </nav>

        {/* Live Rates Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              rateSource === 'live'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {rateSource === 'live' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>{rateSource === 'live' ? `Live kurser (${lastUpdated})` : `Snapshot (${lastUpdated})`}</span>
          </div>

          <button
            onClick={onRefreshRates}
            disabled={isLoadingRates}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
            title="Genindlæs obligationskurser"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRates ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
