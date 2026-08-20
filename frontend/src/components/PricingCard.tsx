import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  to: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  popular = false,
  to
}) => {
  return (
    <div
      className={`p-8 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between relative ${
        popular
          ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/20 scale-102 z-10'
          : 'border-slate-200 shadow-sm hover:border-slate-300'
      }`}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Most Popular
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-slate-900">{name}</h3>
        <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{description}</p>

        <div className="mt-6 flex items-baseline space-x-1">
          <span className="text-4xl font-extrabold text-slate-900">{price}</span>
          <span className="text-xs text-slate-500 font-medium">/{period}</span>
        </div>

        <ul className="mt-8 space-y-3">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Button
          to={to}
          variant={popular ? 'primary' : 'outline'}
          size="lg"
          className="w-full justify-center space-x-2"
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
