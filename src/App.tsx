import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RefinancingView } from './views/RefinancingView';
import { StandardLoanView } from './views/StandardLoanView';
import { TwoLayerLoanView } from './views/TwoLayerLoanView';
import { WelcomeDisclaimerModal } from './components/WelcomeDisclaimerModal';
import { fetchKurser } from './api/rates';
import type { BondLoan } from './calculator/types';
import { FALLBACK_OPTAGELSE_LAAN, FALLBACK_INDFRIELSE_LAAN, FALLBACK_RATES_AS_OF_LABEL } from './api/fallbackRates';
import { useLoanState } from './state/useLoanState';
import { useTheme } from './utils/theme';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
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
  } = useLoanState();

  const [optagelseLoans, setOptagelseLoans] = useState<BondLoan[]>(FALLBACK_OPTAGELSE_LAAN);
  const [indfrielseLoans, setIndfrielseLoans] = useState<BondLoan[]>(FALLBACK_INDFRIELSE_LAAN);
  const [rateSource, setRateSource] = useState<'live' | 'fallback' | 'partial'>('fallback');
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(FALLBACK_RATES_AS_OF_LABEL);

  const loadRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const [optagelseRes, indfrielseRes] = await Promise.all([
        fetchKurser('optagelse'),
        fetchKurser('indfrielse'),
      ]);

      setOptagelseLoans(optagelseRes.loans);
      setIndfrielseLoans(indfrielseRes.loans);
      if (optagelseRes.source === 'live' && indfrielseRes.source === 'live') {
        setRateSource('live');
        setLastUpdated(optagelseRes.timestamp || new Date().toLocaleTimeString('da-DK'));
      } else if (optagelseRes.source === 'live' || indfrielseRes.source === 'live') {
        setRateSource('partial');
        // Partial: live side is fresh; still show fetch time, Navbar labels it "Delvist live"
        setLastUpdated(new Date().toLocaleTimeString('da-DK'));
      } else {
        setRateSource('fallback');
        // Never pretend fallback snapshot is "now"
        setLastUpdated(FALLBACK_RATES_AS_OF_LABEL);
      }
    } catch (err) {
      console.error('Error loading rates:', err);
      setRateSource('fallback');
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <WelcomeDisclaimerModal />

      <Navbar
        currentView={state.currentView}
        onSelectView={setView}
        rateSource={rateSource}
        isLoadingRates={isLoadingRates}
        onRefreshRates={loadRates}
        lastUpdated={lastUpdated}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {state.currentView === 'refinancing' && (
          <RefinancingView
            indfrielseLoans={indfrielseLoans}
            optagelseLoans={optagelseLoans}
            propertyValue={state.propertyValue}
            setPropertyValue={setPropertyValue}
            debt={state.existingRestgaeld}
            setDebt={setDebt}
            remainingYears={state.remainingYears}
            setRemainingYears={setRemainingYears}
            selectedExistingLoanName={state.selectedExistingLoanName}
            setSelectedExistingLoanName={setSelectedExistingLoanName}
            selectedNewLoanName={state.selectedNewLoanName}
            setSelectedNewLoanName={setSelectedNewLoanName}
            enableFrivaerdi={state.enableFrivaerdi}
            setEnableFrivaerdi={setEnableFrivaerdi}
            frivaerdiUdbetalt={state.frivaerdiUdbetalt}
            setFrivaerdiUdbetalt={setFrivaerdiUdbetalt}
          />
        )}

        {state.currentView === 'standard' && (
          <StandardLoanView
            optagelseLoans={optagelseLoans}
            propertyValue={state.propertyValue}
            setPropertyValue={setPropertyValue}
            loanAmount={state.loanAmount}
            setLoanAmount={setDebt}
            selectedStandardLoanName={state.selectedStandardLoanName}
            setSelectedStandardLoanName={setSelectedStandardLoanName}
          />
        )}

        {state.currentView === 'twolayer' && (
          <TwoLayerLoanView
            optagelseLoans={optagelseLoans}
            propertyValue={state.propertyValue}
            setPropertyValue={setPropertyValue}
            totalLoanAmount={state.loanAmount}
            setTotalLoanAmount={setDebt}
            splitPercent={state.splitPercent}
            setSplitPercent={setSplitPercent}
            selectedLayer1LoanName={state.selectedLayer1LoanName}
            setSelectedLayer1LoanName={setSelectedLayer1LoanName}
            selectedLayer2LoanName={state.selectedLayer2LoanName}
            setSelectedLayer2LoanName={setSelectedLayer2LoanName}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
            realkredit.spacepope.dk
          </div>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span>Obligationskurser fra Nasdaq Nordic / Totalkredit</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
