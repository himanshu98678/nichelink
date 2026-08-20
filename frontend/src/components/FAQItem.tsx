import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQItem as FAQItemType } from '../data/faq';

interface FAQItemProps {
  faq: FAQItemType;
  defaultOpen?: boolean;
}

export const FAQItem: React.FC<FAQItemProps> = ({ faq, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none focus:bg-slate-50 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-base font-bold text-slate-900 pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 animate-fade-in">
          {faq.answer}
        </div>
      )}
    </div>
  );
};
