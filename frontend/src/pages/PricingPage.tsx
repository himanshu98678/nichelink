import React from 'react';
import { PricingSection } from '../sections/Pricing';
import { FAQSection } from '../sections/FAQ';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            NicheLink Tiers
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Transparent Plans for Every Professional
          </h1>
          <p className="text-base text-slate-600">
            Join public hubs for free or unlock Pro capabilities to lead projects, message peers, and access exclusive hubs.
          </p>
        </div>

        <PricingSection />

        <div className="mt-12">
          <FAQSection />
        </div>

      </div>
    </div>
  );
};
