import React from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuth }) => {
  const plans = [
    {
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for professionals exploring niche communities and finding projects.',
      features: [
        'Full access to public niche communities',
        'Professional profile with verified skills',
        'Browse and apply to job listings',
        'Join open source collaboration projects',
        'Direct 1-on-1 messaging',
      ],
      cta: 'Join Free',
      popular: false,
    },
    {
      name: 'Pro Professional',
      price: '$12',
      period: 'per month',
      description: 'Ideal for active builders, freelancers, and growth-focused engineers.',
      features: [
        'Everything in Free Starter',
        'Priority job applications & recruiter highlights',
        'Create and lead up to 5 project rooms',
        'Advanced global niche search & skill badges',
        'Unlimited direct messages & attachments',
        'Analytics on profile views & post reach',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Team & Studio',
      price: '$39',
      period: 'per month',
      description: 'For companies and startups recruiting talent and hosting custom hubs.',
      features: [
        'Everything in Pro Professional',
        'Post unlimited verified job listings',
        'Host custom branded niche community hub',
        'Dedicated team candidate search pipeline',
        'Priority 24/7 account support',
      ],
      cta: 'Get Team Access',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50/70 border-y border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Transparent Plans for Every Growth Stage
          </h2>
          <p className="text-base text-gray-600">
            Start for free, join vibrant communities, and upgrade when you are ready to lead project rooms or recruit top talent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between relative ${
                plan.popular
                  ? 'border-indigo-600 shadow-2xl ring-2 ring-indigo-600/20 scale-105 z-10'
                  : 'border-gray-200 shadow-sm hover:border-indigo-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>

                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-500 font-medium">/ {plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-xs text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('signup')}
                className={`mt-8 w-full py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
