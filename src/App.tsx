import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import type { ViewType } from './components/Navbar';
import { RefinancingView } from './views/RefinancingView';
import { StandardLoanView } from './views/StandardLoanView';
import { TwoLayerLoanView } from './views/TwoLayerLoanView';
import { fetchKurser } from './api/rates';
import type { BondLoan } from './calculator/types';
import { FALLBACK_OPTAGELSE_LAAN, FALLBACK_INDFRIELSE_LAAN } from './api/fallbackRates';
import { ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('refinancing');
  const [optagelseLoans, setOptagelseLoans] = useState<BondLoan[]>(FALLBACK_OPTAGELSE_LAAN);
  const [indfrielseLoans, setIndfrielseLoans] = useState<BondLoan[]>(FALLBACK_INDFRIELSE_LAAN);
  const [rateSource, setRateSource] = useState<'live' | 'fallback'>('fallback');
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('da-DK'));

  const loadRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const [optagelseRes, indfrielseRes] = await Promise.all([
        fetchKurser('optagelse'),
        fetchKurser('indfrielse'),
      ]);

      setOptagelseLoans(optagelseRes.loans);
      setIndfrielseLoans(indfrielseRes.loans);
      setRateSource(optagelseRes.source === 'live' || indfrielseRes.source === 'live' ? 'live' : 'fallback');
      setLastUpdated(new Date().toLocaleTimeString('da-DK'));
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        rateSource={rateSource}
        isLoadingRates={isLoadingRates}
        onRefreshRates={loadRates}
        lastUpdated={lastUpdated}
      />

      <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-8 sm:px-6">
        {currentView === 'refinancing' && (
          <RefinancingView
            indfrielseLoans={indfrielseLoans}
            optagelseLoans={optagelseLoans}
          />
        )}

        {currentView === 'standard' && (
          <StandardLoanView optagelseLoans={optagelseLoans} />
        )}

        {currentView === 'twolayer' && (
          <TwoLayerLoanView optagelseLoans={optagelseLoans} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-700">Realkredit.spacepope.dk</span> — Uafhængig realkreditberegner.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Kurser fra Nasdaq Nordic / Totalkredit</span>
            <span>•</span>
            <a
              href="https://realkred.it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-600"
            >
              <span>Inspireret af realkred.it</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
