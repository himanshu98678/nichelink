import React from 'react';
import { X, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StripeCheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen } = useAuth();

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <h3 className="text-xl font-bold text-slate-900">Billing setup</h3>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-8 text-center space-y-4">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-xl font-extrabold text-slate-900">Checkout is not connected</h4>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">Your current plan and subscription status are available from Billing. A payment provider will be connected in a later billing step.</p>
          <button type="button" onClick={() => setIsCheckoutOpen(false)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold">Close</button>
        </div>

      </div>
    </div>
  );
};
