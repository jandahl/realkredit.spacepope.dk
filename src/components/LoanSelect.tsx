import React from 'react';
import type { BondLoan } from '../calculator/types';
import { formatKurs } from '../utils/formatters';
import { ExternalLink } from 'lucide-react';

interface LoanSelectProps {
  label: string;
  loans: BondLoan[];
  selectedLoan: BondLoan | null;
  onSelectLoan: (loan: BondLoan) => void;
  subtext?: string;
}

export const LoanSelect: React.FC<LoanSelectProps> = ({
  label,
  loans,
  selectedLoan,
  onSelectLoan,
  subtext,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loanName = e.target.value;
    const found = loans.find((l) => l.name === loanName);
    if (found) {
      onSelectLoan(found);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {selectedLoan?.nasdaqUrl && (
          <a
            href={selectedLoan.nasdaqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            title="Se kurs på Nasdaq Nordic"
          >
            <span>Nasdaq</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="relative">
        <select
          value={selectedLoan?.name || ''}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {loans.map((loan) => (
            <option key={loan.name + loan.kurs} value={loan.name}>
              {loan.name} — Kurs {formatKurs(loan.kurs)}
            </option>
          ))}
        </select>
      </div>

      {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
    </div>
  );
};
