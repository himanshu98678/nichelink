import React from 'react';
import { PricingCard } from '../components/PricingCard';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-slate-50/50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Choose the Way You Connect.
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Start for free to explore communities, or upgrade to Pro to unlock unlimited messaging and project matching.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE PLAN */}
          <PricingCard
            name={SUBSCRIPTION_PLANS[0].name.toUpperCase()}
            price={`$${SUBSCRIPTION_PLANS[0].price}`}
            period={SUBSCRIPTION_PLANS[0].interval}
            description="Perfect for exploring niche communities and finding projects."
            features={SUBSCRIPTION_PLANS[0].features}
            buttonText="Get Started Free"
            popular={false}
            to="/register"
          />

          {/* PRO PLAN */}
          <PricingCard
            name={SUBSCRIPTION_PLANS[1].name.toUpperCase()}
            price={`$${SUBSCRIPTION_PLANS[1].price}`}
            period={SUBSCRIPTION_PLANS[1].interval}
            description="Designed for active remote professionals, builders, and job seekers."
            features={SUBSCRIPTION_PLANS[1].features}
            buttonText="Upgrade to Pro"
            popular={true}
            to="/register"
          />
        </div>

      </div>
    </section>
  );
};
