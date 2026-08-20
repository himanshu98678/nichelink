import React from 'react';
import { ArrowRight, Compass, MessageCircle, Rocket } from 'lucide-react';
import { Button } from '../components/Button';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'DISCOVER',
      description: 'Find communities that match your skills and interests.',
      icon: Compass,
    },
    {
      number: '02',
      title: 'CONNECT',
      description: 'Meet professionals and start meaningful conversations.',
      icon: MessageCircle,
    },
    {
      number: '03',
      title: 'COLLABORATE',
      description: 'Find projects, jobs and people to build with.',
      icon: Rocket,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            From Community to Connection.
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            A simple, high-signal path to growing your network and building meaningful projects.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold text-slate-300 group-hover:text-indigo-600 transition-colors">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button to="/signup" variant="primary" size="lg" className="space-x-2 bg-slate-900 hover:bg-slate-800 text-white">
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button to="/signin" variant="outline" size="lg" className="border-slate-300 text-slate-700">
            Sign In
          </Button>
        </div>

      </div>
    </section>
  );
};
