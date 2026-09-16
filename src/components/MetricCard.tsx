import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  delta?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral'; // positive: green (good), negative: red
  };
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  delta,
  highlight = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
        highlight
          ? 'border-blue-200 bg-blue-50/50 shadow-sm'
          : 'border-slate-200 bg-white shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {subValue && <span className="text-xs font-normal text-slate-500">{subValue}</span>}
      </div>

      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium">
          {delta.type === 'positive' && (
            <span className="flex items-center text-emerald-600">
              <ArrowDownRight className="h-4 w-4" />
              {delta.text}
            </span>
          )}
          {delta.type === 'negative' && (
            <span className="flex items-center text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
              {delta.text}
            </span>
          )}
          {delta.type === 'neutral' && (
            <span className="text-slate-600">{delta.text}</span>
          )}
        </div>
      )}
    </div>
  );
};
