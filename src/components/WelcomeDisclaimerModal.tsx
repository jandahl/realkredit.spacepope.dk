import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const STORAGE_KEY = 'hide_welcome_disclaimer';

export const WelcomeDisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const isHidden = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isHidden) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    primaryBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dontShowAgain]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-disclaimer-title"
        className="relative w-full max-w-lg rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all"
      >
        {/* Header Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 id="welcome-disclaimer-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Vigtig Ansvarsfraskrivelse
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Læs før du bruger beregneren
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Luk"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Disclaimer Body */}
        <div className="my-5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 p-4 text-sm font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
          Tag dig sammen og undersøg nærmere end bare en hjemmeside! Det er de næste årtier af dit liv, der er tale om – og hvad fanden ved jeg overhovedet om det her?
        </div>

        {/* Footer controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <span>Vis ikke denne advarsel igen</span>
          </label>

          <button
            ref={primaryBtnRef}
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            OK, jeg forstår!
          </button>
        </div>
      </div>
    </div>
  );
};
