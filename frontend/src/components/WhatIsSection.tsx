import React from 'react';
import { Network, Users, Briefcase, FolderKanban, Handshake, MessageSquare, ArrowRight } from 'lucide-react';

interface WhatIsSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const WhatIsSection: React.FC<WhatIsSectionProps> = ({ onOpenAuth }) => {
  const pillars = [
    {
      title: 'Professional Networking',
      description: 'Connect with peers based on verified skills, domain depth, and shared industry goals.',
      icon: Network,
      badge: 'Identity',
    },
    {
      title: 'Niche Communities',
      description: 'Join focused spaces tailored to your exact stack, role, or interest area.',
      icon: Users,
      badge: 'Hubs',
    },
    {
      title: 'Jobs & Opportunities',
      description: 'Discover curated job openings matched directly to your verified skills.',
      icon: Briefcase,
      badge: 'Careers',
    },
    {
      title: 'Project Showcases',
      description: 'Share what you are building and recruit collaborators with complementary skills.',
      icon: FolderKanban,
      badge: 'Build',
    },
    {
      title: 'Real Collaboration',
      description: 'Form teams, hold code reviews, and work on open-source or commercial ideas.',
      icon: Handshake,
      badge: 'Teamwork',
    },
    {
      title: 'Direct Messaging',
      description: 'Reach out directly via 1-on-1 chat or join active group channels in real time.',
      icon: MessageSquare,
      badge: 'Connect',
    },
  ];

  return (
    <section id="about" className="py-20 bg-gray-900 text-white relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-3.5 py-1.5 rounded-full">
            Under 10 Seconds
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            What is <span className="text-indigo-400">NicheLink</span>?
          </h2>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            NicheLink is the all-in-one professional ecosystem where you build your network, engage in targeted communities, land niche jobs, and collaborate on real projects.
          </p>
        </div>

        {/* 6 Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-gray-800/80 hover:bg-gray-800 p-6 rounded-2xl border border-gray-700/80 hover:border-indigo-500/50 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-800">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick CTA banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-gray-900 border border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold text-white">Ready to find your niche?</h4>
            <p className="text-sm text-indigo-200">Set up your professional profile in less than 2 minutes.</p>
          </div>
          <button
            onClick={() => onOpenAuth('signup')}
            className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
