import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Layers, 
  Briefcase, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Code2, 
  Cpu, 
  Palette, 
  Rocket, 
  Globe, 
  BookOpen, 
  Lock,
  Compass,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { FEATURES_DATA } from '../data/features';
import { FeatureCard } from '../components/FeatureCard';
import { COMMUNITIES_DATA } from '../data/communities';

export const FeaturesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', 'Engineering', 'AI & Data', 'Design', 'Business', 'Lifestyle'];

  const filteredCommunities = selectedCategory === 'All' 
    ? COMMUNITIES_DATA.slice(0, 6) 
    : COMMUNITIES_DATA.filter(c => c.category === selectedCategory).slice(0, 6);

  const renderCommunityIcon = (iconName: string) => {
    const className = "w-5 h-5 text-indigo-600";
    switch (iconName) {
      case 'Code2': return <Code2 className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Rocket': return <Rocket className={className} />;
      case 'Globe': return <Globe className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      default: return <Users className={className} />;
    }
  };

  return (
    <section id="features" className="py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* ========================================================= */}
        {/* 1. Core Platform Capabilities Grid                        */}
        {/* ========================================================= */}
        <div>
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Connect & Build
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Purpose-built tools for remote professionals to exchange deep technical insights, co-found projects, and expand high-signal networks.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_DATA.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Community Hubs Preview Cards (Click Learn More -> Login)*/}
        {/* ========================================================= */}
        <div className="pt-8 border-t border-slate-200">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Compass className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Active Remote Micro-Tribes
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Featured Community Hubs
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Explore specialized rooms where remote builders discuss architecture, market strategies, and async workflows.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Hubs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((hub) => (
              <div
                key={hub.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between p-6 group"
              >
                <div>
                  {/* Top Bar with Icon, Category, Pro/Free Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                        {renderCommunityIcon(hub.iconName)}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {hub.name}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500">{hub.category}</span>
                      </div>
                    </div>

                    {hub.isProOnly ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                    {hub.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hub.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700">{hub.members}</span>
                    <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{hub.activeNowCount}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button: Learn More -> Direct Login Link */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/signin"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group-hover:translate-x-0.5 transform duration-150"
                  >
                    <span>Learn More & Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="text-[10px] text-slate-400 font-medium">
                    Sign in to enter
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Callout Banner to Prompt Login / Signup */}
          <div className="mt-10 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                <span>Join Over 40,000+ Remote Tech Professionals</span>
              </h4>
              <p className="text-xs text-slate-300 max-w-xl">
                Sign in or create your free profile to access real-time discussion boards, project collaboration, and direct messaging across all hubs.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 shrink-0">
              <Link
                to="/signin"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
