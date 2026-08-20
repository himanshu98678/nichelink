import React from 'react';
import { ArrowRight, Sparkles, Globe2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import heroVisual from '../assets/images/nichelink_hero_visual_1786613746955.jpg';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 bg-transparent backdrop-blur-[1px] overflow-hidden border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Small Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-800 text-xs font-bold uppercase tracking-widest mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>BUILT FOR REMOTE PROFESSIONALS</span>
        </div>

        {/* Editorial Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Find Your Tribe.<br />
          <span className="text-slate-900">Build Your Network.</span><br />
          <span className="text-slate-800">Grow Together.</span>
        </h1>

        {/* Supporting Line */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Connect with focused professional communities, discover opportunities, and build meaningful relationships beyond the noise of traditional social networks.
        </p>

        {/* CTA Buttons - Two main Auth CTAs: Sign Up and Sign In */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm sm:max-w-md mx-auto">
          <Button to="/signup" variant="primary" size="lg" className="w-full sm:w-auto space-x-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
            <span>Sign Up Free</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button to="/signin" variant="outline" size="lg" className="w-full sm:w-auto bg-white/80 hover:bg-white text-slate-800 border-slate-300">
            Sign In
          </Button>
        </div>

        {/* Standalone Editorial Hero Visual (50% Size) */}
        <div className="mt-8 sm:mt-12 relative max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-white group">
          <img
            src="https://www.ivalueplus.com/wp-content/uploads/2026/07/Hire-Remote-Offshore-Developers.jpg"
            alt="Remote professionals collaborating online globally"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-[240px] filter brightness-[0.98] contrast-[1.02]"
            onError={(e) => {
              // Fallback if external image fails to load
              (e.currentTarget as HTMLImageElement).src = heroVisual;
            }}
          />

          {/* Floating Minimal Accents on Hero Visual */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200/80 shadow-xs flex items-center space-x-1.5 text-[11px] font-bold text-slate-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Global Remote Tech Network</span>
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-md flex items-center space-x-2 text-[11px] font-medium">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Async Collaboration • 100% Peer Verified</span>
          </div>
        </div>

      </div>
    </section>
  );
};

