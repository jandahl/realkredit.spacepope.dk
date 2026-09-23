import { useState, useEffect, useCallback } from 'react';
import type { ViewType } from '../components/Navbar';
import { resolveAppMode, buildShareUrl, type AppMode } from '../utils/appMode';

export type { AppMode };

export interface SharedLoanState {
  currentView: ViewType;
  mode: AppMode;
  propertyValue: number;
  existingRestgaeld: number;
  loanAmount: number;
  remainingYears: number;
  splitPercent: number;
  selectedExistingLoanName: string | null;
  selectedNewLoanName: string | null;
  selectedStandardLoanName: string | null;
  selectedLayer1LoanName: string | null;
  selectedLayer2LoanName: string | null;
  enableFrivaerdi: boolean;
  frivaerdiUdbetalt: number;
  frivaerdiStrategy: 'omlaegning' | 'tillaeg';
  newLoanYears: number | null;
  existingAfdragsfriYears: number | null;
  newAfdragsfriYears: number | null;
  reportStrategy: 'a' | 'b' | 'both';
}

const STORAGE_KEY = 'realkredit_calculator_state_v1';

const DEFAULT_STATE: SharedLoanState = {
  currentView: 'refinancing',
  mode: 'edit',
  propertyValue: 3_000_000,
  existingRestgaeld: 2_000_000,
  loanAmount: 2_000_000,
  remainingYears: 30,
  splitPercent: 40,
  selectedExistingLoanName: null,
  selectedNewLoanName: null,
  selectedStandardLoanName: null,
  selectedLayer1LoanName: null,
  selectedLayer2LoanName: null,
  enableFrivaerdi: false,
  frivaerdiUdbetalt: 0,
  frivaerdiStrategy: 'omlaegning',
  newLoanYears: null,
  existingAfdragsfriYears: null,
  newAfdragsfriYears: null,
  reportStrategy: 'a',
};

// Parse initial state from URL params or localStorage
function getInitialState(): SharedLoanState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlParams = urlParams.has('tab') || urlParams.has('pv') || urlParams.has('debt');
  const mode = resolveAppMode(window.location.search);

  if (hasUrlParams) {
    const viewParam = urlParams.get('tab') as ViewType;
    const currentView = ['refinancing', 'standard', 'twolayer'].includes(viewParam)
      ? viewParam
      : 'refinancing';

    const propertyValue = parseInt(urlParams.get('pv') || '', 10) || DEFAULT_STATE.propertyValue;
    const debt = parseInt(urlParams.get('debt') || '', 10) || DEFAULT_STATE.existingRestgaeld;
    const remainingYears = parseInt(urlParams.get('years') || '', 10) || DEFAULT_STATE.remainingYears;
    const splitPercent = parseInt(urlParams.get('split') || '', 10) || DEFAULT_STATE.splitPercent;
    const enableFrivaerdi = urlParams.get('cashout') === '1';
    const frivaerdiUdbetalt = parseInt(urlParams.get('cash') || '', 10) || DEFAULT_STATE.frivaerdiUdbetalt;
    const stratParam = urlParams.get('strat') || urlParams.get('strategy');
    const frivaerdiStrategy: 'omlaegning' | 'tillaeg' =
      stratParam === 'tillaeg' || stratParam === 'b' ? 'tillaeg' : 'omlaegning';

    const nyearsVal = parseInt(urlParams.get('nyears') || '', 10);
    const newLoanYears = !isNaN(nyearsVal) && nyearsVal > 0 ? nyearsVal : null;

    const oldIoVal = parseInt(urlParams.get('oldIo') || '', 10);
    const existingAfdragsfriYears = !isNaN(oldIoVal) && oldIoVal >= 0 ? oldIoVal : null;

    const newIoVal = parseInt(urlParams.get('newIo') || '', 10);
    const newAfdragsfriYears = !isNaN(newIoVal) && newIoVal >= 0 ? newIoVal : null;

    const repStratParam = urlParams.get('repStrat') || urlParams.get('reportStrategy');
    const reportStrategy: 'a' | 'b' | 'both' =
      repStratParam === 'b' ? 'b' : repStratParam === 'both' ? 'both' : 'a';

    return {
      currentView,
      mode,
      propertyValue,
      existingRestgaeld: debt,
      loanAmount: debt,
      remainingYears,
      splitPercent,
      selectedExistingLoanName: urlParams.get('oldLoan') || null,
      selectedNewLoanName: urlParams.get('newLoan') || null,
      selectedStandardLoanName: urlParams.get('stdLoan') || null,
      selectedLayer1LoanName: urlParams.get('l1Loan') || null,
      selectedLayer2LoanName: urlParams.get('l2Loan') || null,
      enableFrivaerdi,
      frivaerdiUdbetalt,
      frivaerdiStrategy,
      newLoanYears,
      existingAfdragsfriYears,
      newAfdragsfriYears,
      reportStrategy,
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fresh visit without share params → edit (URL is source of truth for share).
      // Do not restore a stale report mode from localStorage on a clean URL.
      const { mode: _ignoredMode, ...rest } = parsed;
      return { ...DEFAULT_STATE, ...rest, mode: 'edit' };
    }
  } catch (err) {
    console.warn('Failed to parse saved state from localStorage:', err);
  }

  return { ...DEFAULT_STATE, mode: 'edit' };
}

export function useLoanState() {
  const [state, setState] = useState<SharedLoanState>(getInitialState);

  // Sync to localStorage and URL search params
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save state to localStorage:', err);
    }

    const params = new URLSearchParams();
    params.set('tab', state.currentView);
    params.set('mode', state.mode);
    params.set('pv', state.propertyValue.toString());
    params.set('debt', state.existingRestgaeld.toString());
    params.set('years', state.remainingYears.toString());
    params.set('split', state.splitPercent.toString());

    if (state.enableFrivaerdi) {
      params.set('cashout', '1');
      if (state.frivaerdiUdbetalt > 0) {
        params.set('cash', state.frivaerdiUdbetalt.toString());
      }
      params.set('strat', state.frivaerdiStrategy);
    }

    if (state.selectedExistingLoanName) params.set('oldLoan', state.selectedExistingLoanName);
    if (state.selectedNewLoanName) params.set('newLoan', state.selectedNewLoanName);
    if (state.selectedStandardLoanName) params.set('stdLoan', state.selectedStandardLoanName);
    if (state.selectedLayer1LoanName) params.set('l1Loan', state.selectedLayer1LoanName);
    if (state.selectedLayer2LoanName) params.set('l2Loan', state.selectedLayer2LoanName);
    if (state.newLoanYears != null) params.set('nyears', state.newLoanYears.toString());
    if (state.existingAfdragsfriYears != null) params.set('oldIo', state.existingAfdragsfriYears.toString());
    if (state.newAfdragsfriYears != null) params.set('newIo', state.newAfdragsfriYears.toString());
    if (state.mode === 'report' || state.reportStrategy !== 'a') params.set('repStrat', state.reportStrategy);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [state]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setState(getInitialState());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setView = useCallback((currentView: ViewType) => {
    setState((prev) => ({ ...prev, currentView }));
  }, []);

  const setMode = useCallback((mode: AppMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setPropertyValue = useCallback((propertyValue: number) => {
    setState((prev) => ({ ...prev, propertyValue }));
  }, []);

  // Sync debt across existingRestgaeld & loanAmount
  const setDebt = useCallback((debt: number) => {
    setState((prev) => ({
      ...prev,
      existingRestgaeld: debt,
      loanAmount: debt,
    }));
  }, []);

  const setRemainingYears = useCallback((remainingYears: number) => {
    setState((prev) => ({ ...prev, remainingYears }));
  }, []);

  const setSplitPercent = useCallback((splitPercent: number) => {
    setState((prev) => ({ ...prev, splitPercent }));
  }, []);

  const setSelectedExistingLoanName = useCallback((selectedExistingLoanName: string | null) => {
    setState((prev) => ({ ...prev, selectedExistingLoanName }));
  }, []);

  const setSelectedNewLoanName = useCallback((selectedNewLoanName: string | null) => {
    setState((prev) => ({ ...prev, selectedNewLoanName }));
  }, []);

  const setSelectedStandardLoanName = useCallback((selectedStandardLoanName: string | null) => {
    setState((prev) => ({ ...prev, selectedStandardLoanName }));
  }, []);

  const setSelectedLayer1LoanName = useCallback((selectedLayer1LoanName: string | null) => {
    setState((prev) => ({ ...prev, selectedLayer1LoanName }));
  }, []);

  const setSelectedLayer2LoanName = useCallback((selectedLayer2LoanName: string | null) => {
    setState((prev) => ({ ...prev, selectedLayer2LoanName }));
  }, []);

  const setEnableFrivaerdi = useCallback((enableFrivaerdi: boolean) => {
    setState((prev) => ({ ...prev, enableFrivaerdi }));
  }, []);

  const setFrivaerdiUdbetalt = useCallback((frivaerdiUdbetalt: number) => {
    setState((prev) => ({ ...prev, frivaerdiUdbetalt }));
  }, []);

  const setFrivaerdiStrategy = useCallback((frivaerdiStrategy: 'omlaegning' | 'tillaeg') => {
    setState((prev) => ({ ...prev, frivaerdiStrategy }));
  }, []);

  const setNewLoanYears = useCallback((newLoanYears: number | null) => {
    setState((prev) => ({ ...prev, newLoanYears }));
  }, []);

  const setExistingAfdragsfriYears = useCallback((existingAfdragsfriYears: number | null) => {
    setState((prev) => ({ ...prev, existingAfdragsfriYears }));
  }, []);

  const setNewAfdragsfriYears = useCallback((newAfdragsfriYears: number | null) => {
    setState((prev) => ({ ...prev, newAfdragsfriYears }));
  }, []);

  const setReportStrategy = useCallback((reportStrategy: 'a' | 'b' | 'both') => {
    setState((prev) => ({ ...prev, reportStrategy }));
  }, []);

  const getShareableUrl = useCallback(() => {
    return buildShareUrl(window.location.href);
  }, []);

  return {
    state,
    setView,
    setMode,
    setPropertyValue,
    setDebt,
    setRemainingYears,
    setSplitPercent,
    setSelectedExistingLoanName,
    setSelectedNewLoanName,
    setSelectedStandardLoanName,
    setSelectedLayer1LoanName,
    setSelectedLayer2LoanName,
    setEnableFrivaerdi,
    setFrivaerdiUdbetalt,
    setFrivaerdiStrategy,
    setNewLoanYears,
    setExistingAfdragsfriYears,
    setNewAfdragsfriYears,
    setReportStrategy,
    getShareableUrl,
  };
}
