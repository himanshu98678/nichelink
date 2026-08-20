import React from 'react';
import { Network, ShieldCheck, Heart, Users, Globe2, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OUR MISSION</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            About NicheLink
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NicheLink was created to fix broken professional social networks. We build focused, noise-free communities where remote workers, engineers, designers, and builders connect over shared craft.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Network className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Connecting People Beyond the Noise
          </h2>

          <p className="text-base text-slate-600 leading-relaxed">
            Traditional social networks prioritize engagement bait, viral fluff, and generic self-promotion. NicheLink replaces vanity metrics with high-signal, asynchronous discussion hubs organized around specific tools, languages, roles, and remote lifestyles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-slate-900">100%</span>
              <p className="text-xs text-slate-500">Focused on Remote Craft</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-slate-900">Zero</span>
              <p className="text-xs text-slate-500">Algorithmic Noise</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-slate-900">50+</span>
              <p className="text-xs text-slate-500">Global Tech Hubs</p>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 text-center">Core Principles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Signal Over Noise</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discussions are curated by peers who actively build, code, design, and operate remote businesses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90">
              <Users className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Authentic Matchmaking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Find co-founders, project partners, and remote team members based on real complementary skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90">
              <Globe2 className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Location Agnostic</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with engineers and creators from San Francisco to Lisbon, Tokyo, and Bali.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Button to="/register" variant="primary" size="lg">
            Join the NicheLink Network Today →
          </Button>
        </div>

      </div>
    </div>
  );
};
