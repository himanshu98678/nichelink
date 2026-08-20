import React from 'react';
import { FAQ_DATA } from '../data/faq';
import { FAQItem } from '../components/FAQItem';

export const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="py-20 bg-slate-50/50 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-600">
            Everything you need to know about NicheLink communities, membership tiers, and features.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((faq, idx) => (
            <FAQItem key={faq.id} faq={faq} defaultOpen={idx === 0} />
          ))}
        </div>

      </div>
    </section>
  );
};
