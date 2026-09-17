import React, { useEffect, useRef } from 'react';
import type { RefinancingComparison, TillaegslaanComparison } from '../calculator/types';
import { DumbIdeasPanel } from './DumbIdeasPanel';
import { X } from 'lucide-react';

interface DumbIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: RefinancingComparison;
  tillaegslaanComparison?: TillaegslaanComparison | null;
  breakevenYears: number | null;
  existingAfdragsfriYears?: number;
  newAfdragsfriYears?: number;
}

export const DumbIdeasModal: React.FC<DumbIdeasModalProps> = ({
  isOpen,
  onClose,
  comparison,
  tillaegslaanComparison,
  breakevenYears,
  existingAfdragsfriYears,
  newAfdragsfriYears,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dumb-ideas-title"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 z-10 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
      >
        <div className="flex justify-end shrink-0 -mt-1 -mr-1 mb-1">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Luk"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 py-1">
          <DumbIdeasPanel
            comparison={comparison}
            tillaegslaanComparison={tillaegslaanComparison}
            breakevenYears={breakevenYears}
            existingAfdragsfriYears={existingAfdragsfriYears}
            newAfdragsfriYears={newAfdragsfriYears}
            variant="modal"
          />
        </div>

        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Forstået, luk reality check
          </button>
        </div>
      </div>
    </div>
  );
};
