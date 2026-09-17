import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FieldError } from '../utils/ltv';

interface ValidationToastProps {
  errors: FieldError[];
}

function focusAnchor(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = el.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]');
  focusable?.focus({ preventScroll: true });
}

/** Persistent red warning bar listing non-compliant fields; each item jumps to the field. */
export const ValidationToast: React.FC<ValidationToastProps> = ({ errors }) => {
  if (!errors.length) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none"
    >
      <div className="mx-auto max-w-6xl pointer-events-auto rounded-xl border border-rose-500/80 bg-rose-950/95 text-rose-50 shadow-lg backdrop-blur-md px-3.5 py-3 sm:px-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-100">
              Ret følgende felter for at overholde 80 % LTV
            </p>
            <ul className="mt-1.5 space-y-1">
              {errors.map((err) => (
                <li key={err.id}>
                  <button
                    type="button"
                    onClick={() => focusAnchor(err.anchorId)}
                    className="text-left text-xs sm:text-sm text-rose-200 underline decoration-rose-400/70 underline-offset-2 hover:text-white transition-colors"
                  >
                    {err.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
