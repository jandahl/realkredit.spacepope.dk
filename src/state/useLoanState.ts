import { useState, useEffect, useCallback } from 'react';
import type { ViewType } from '../components/Navbar';

export interface SharedLoanState {
  currentView: ViewType;
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
}

const STORAGE_KEY = 'realkredit_calculator_state_v1';

const DEFAULT_STATE: SharedLoanState = {
  currentView: 'refinancing',
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
};

// Parse initial state from URL params or localStorage
function getInitialState(): SharedLoanState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlParams = urlParams.has('tab') || urlParams.has('pv') || urlParams.has('debt');

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

    return {
      currentView,
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
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse saved state from localStorage:', err);
  }

  return DEFAULT_STATE;
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
    params.set('pv', state.propertyValue.toString());
    params.set('debt', state.existingRestgaeld.toString());
    params.set('years', state.remainingYears.toString());
    params.set('split', state.splitPercent.toString());

    if (state.enableFrivaerdi) {
      params.set('cashout', '1');
      if (state.frivaerdiUdbetalt > 0) {
        params.set('cash', state.frivaerdiUdbetalt.toString());
      }
    }

    if (state.selectedExistingLoanName) params.set('oldLoan', state.selectedExistingLoanName);
    if (state.selectedNewLoanName) params.set('newLoan', state.selectedNewLoanName);
    if (state.selectedStandardLoanName) params.set('stdLoan', state.selectedStandardLoanName);
    if (state.selectedLayer1LoanName) params.set('l1Loan', state.selectedLayer1LoanName);
    if (state.selectedLayer2LoanName) params.set('l2Loan', state.selectedLayer2LoanName);

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

  const getShareableUrl = useCallback(() => {
    return window.location.href;
  }, []);

  return {
    state,
    setView,
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
    getShareableUrl,
  };
}
