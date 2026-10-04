import type { SharedLoanState } from '../state/useLoanState';

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: number;
  state: SharedLoanState;
  // Summary snapshot metrics for instant visual comparison
  metrics: {
    monthlyPaymentAfterTax: number;
    monthlyAfdrag: number;
    deltaRestgaeld: number;
    breakevenYears: number | null;
    loanTitle: string;
    netBenefitTitle?: string;
  };
}

const STORAGE_KEY = 'realkredit_saved_scenarios_v1';

export function loadSavedScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load saved scenarios:', err);
    return [];
  }
}

export function saveScenario(scenario: SavedScenario): SavedScenario[] {
  const current = loadSavedScenarios().filter((s) => s.id !== scenario.id);
  const updated = [scenario, ...current].slice(0, 5); // Keep up to 5 scenarios
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save scenario:', err);
  }
  return updated;
}

export function removeSavedScenario(id: string): SavedScenario[] {
  const updated = loadSavedScenarios().filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to remove scenario:', err);
  }
  return updated;
}
