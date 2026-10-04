import React, { useState } from 'react';
import { BookmarkPlus, BookmarkCheck, ArrowRight, Trash2, X, Scale } from 'lucide-react';
import type { SharedLoanState } from '../state/useLoanState';
import {
  loadSavedScenarios,
  saveScenario,
  removeSavedScenario,
  type SavedScenario,
} from '../utils/scenarioStore';
import { formatKr } from '../utils/formatters';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: SharedLoanState;
  currentMetrics: {
    monthlyPaymentAfterTax: number;
    monthlyAfdrag: number;
    deltaRestgaeld: number;
    breakevenYears: number | null;
    loanTitle: string;
    netBenefitTitle?: string;
  };
  onRestoreScenario: (state: SharedLoanState) => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  currentState,
  currentMetrics,
  onRestoreScenario,
}) => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadSavedScenarios());
  const [justSaved, setJustSaved] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState(
    () => currentMetrics.loanTitle || 'Mit scenarie',
  );

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const newScenario: SavedScenario = {
      id: `sc_${Date.now()}`,
      name: scenarioNameInput.trim() || currentMetrics.loanTitle || 'Scenarie',
      timestamp: Date.now(),
      state: currentState,
      metrics: currentMetrics,
    };
    const updated = saveScenario(newScenario);
    setScenarios(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleRemove = (id: string) => {
    const updated = removeSavedScenario(id);
    setScenarios(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Gem & Sammenlign Scenarier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sammenlign op til 5 gemte lånealternativer side om side.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Save Current Bar */}
        <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 shrink-0">
              Gem aktuelt:
            </span>
            <input
              type="text"
              value={scenarioNameInput}
              onChange={(e) => setScenarioNameInput(e.target.value)}
              placeholder="Navngiv scenarie..."
              className="w-full sm:max-w-xs rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveCurrent}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              justSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {justSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                <span>Gemt!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                <span>Gem dette scenarie</span>
              </>
            )}
          </button>
        </div>

        {/* Comparison Table / List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-800/30">
              <Scale className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ingen gemte scenarier endnu
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Tryk på "Gem dette scenarie" ovenfor for at fastfryse dine nuværende tal, og skift derefter lånetype for at sammenligne.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-850 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={sc.name}>
                          {sc.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sc.timestamp).toLocaleDateString('da-DK', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(sc.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                        title="Fjern scenarie"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Lån:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]" title={sc.metrics.loanTitle}>
                          {sc.metrics.loanTitle}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Ydelse efter skat:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {formatKr(sc.metrics.monthlyPaymentAfterTax)}/md.
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Afdrag pr. md:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatKr(sc.metrics.monthlyAfdrag)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Ændring i restgæld:</span>
                        <span className="font-semibold">
                          {sc.metrics.deltaRestgaeld > 0 ? '+' : ''}{formatKr(sc.metrics.deltaRestgaeld)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Breakeven:</span>
                        <span className="font-semibold">
                          {sc.metrics.breakevenYears !== null
                            ? `${sc.metrics.breakevenYears.toFixed(1)} år`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreScenario(sc.state);
                      onClose();
                    }}
                    className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Indlæs dette scenarie</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
