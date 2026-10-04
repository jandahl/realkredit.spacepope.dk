import React, { useState } from 'react';
import { Pencil, FileText, ArrowRightLeft, Layers, Columns2, Share2, Check } from 'lucide-react';

export type ReportStrategy = 'a' | 'b' | 'both';

interface ReportBarProps {
  onEdit: () => void;
  /** Optional refinancing A/B/Both control */
  strategy?: ReportStrategy;
  onStrategyChange?: (s: ReportStrategy) => void;
  /** When false, Option B is disabled with explanation */
  optionBAvailable?: boolean;
  optionBDisabledReason?: string;
  title?: string;
  getShareableUrl?: () => string;
}

export const ReportBar: React.FC<ReportBarProps> = ({
  onEdit,
  strategy,
  onStrategyChange,
  optionBAvailable = false,
  optionBDisabledReason = 'Aktivér friværdiudtag for at sammenligne tillægslån.',
  title = 'Rapport',
  getShareableUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const showStrategy = typeof strategy === 'string' && typeof onStrategyChange === 'function';

  const handleShare = async () => {
    try {
      const url = getShareableUrl ? getShareableUrl() : window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy report link:', err);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs flex flex-col gap-3 transition-colors print:border-none print:shadow-none print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 print:hidden">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:hidden">
              Skrivebeskyttet oversigt — tryk Rediger for at ændre forudsætninger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleShare}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
              copied
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Kopiér link til rapporten"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Kopieret!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Kopiér link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            Rediger
          </button>
        </div>
      </div>

      {showStrategy && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onStrategyChange!('a')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                strategy === 'a'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Option A: Fuld omlægning</span>
            </button>
            <button
              type="button"
              disabled={!optionBAvailable}
              title={!optionBAvailable ? optionBDisabledReason : undefined}
              onClick={() => optionBAvailable && onStrategyChange!('b')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
                !optionBAvailable
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : strategy === 'b'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold cursor-pointer'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Option B: Tillægslån</span>
            </button>
            <button
              type="button"
              disabled={!optionBAvailable}
              title={!optionBAvailable ? optionBDisabledReason : undefined}
              onClick={() => optionBAvailable && onStrategyChange!('both')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
                !optionBAvailable
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : strategy === 'both'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold cursor-pointer'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Begge</span>
            </button>
          </div>
          {!optionBAvailable && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 px-0.5">{optionBDisabledReason}</p>
          )}
        </div>
      )}
    </div>
  );
};

/** Subtle control shown in edit mode to preview the share/report view. */
export const ShowReportLink: React.FC<{ onShow: () => void }> = ({ onShow }) => (
  <button
    type="button"
    onClick={onShow}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
  >
    <FileText className="h-3.5 w-3.5" />
    Vis rapport
  </button>
);
