import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow overlay */}
      <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-900 to-slate-900 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>START YOUR JOURNEY TODAY</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Your Next Opportunity Might Be One Conversation Away.
        </h2>

        {/* Description */}
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          Join a community built around your work, interests and goals.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Button to="/signup" variant="primary" size="lg" className="w-full sm:w-auto space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-600/30">
            <span>Sign Up Free</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button to="/signin" variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
            Sign In
          </Button>
        </div>

      </div>
    </section>
  );
};
