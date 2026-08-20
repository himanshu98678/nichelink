import React from 'react';
import { 
  Network, Users, Briefcase, FolderKanban, ShieldCheck, MessageSquare, 
  CheckCircle2, Sparkles, ArrowRight
} from 'lucide-react';

interface WhyNicheLinkSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const WhyNicheLinkSection: React.FC<WhyNicheLinkSectionProps> = ({ onOpenAuth }) => {
  const points = [
    {
      title: 'One Place for Professional Networking',
      description: 'Ditch fragmented tools. Manage your professional connections, discussions, and portfolio in a unified ecosystem.',
      icon: Network,
    },
    {
      title: 'Niche-Based Communities',
      description: 'Engage in dedicated groups structured specifically around tech stacks, design frameworks, and specialized domains.',
      icon: Users,
    },
    {
      title: 'Real Opportunities & Job Matches',
      description: 'No generic job spam. Get matched directly with hiring managers seeking your verified technical or creative skills.',
      icon: Briefcase,
    },
    {
      title: 'Active Project Collaboration',
      description: 'Build real software alongside passionate peers, recruit collaborators, and launch open source products.',
      icon: FolderKanban,
    },
    {
      title: 'Verified Professional Identity',
      description: 'Showcase real proof of work, skill endorsements, code repositories, and educational background.',
      icon: ShieldCheck,
    },
    {
      title: 'Direct Peer Communication',
      description: 'Initiate 1-on-1 private messaging or join active community chat channels with zero connection friction.',
      icon: MessageSquare,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Why Choose Us</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Why Professionals Choose NicheLink
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            A purpose-built platform designed from the ground up for authentic connections, focused learning, and real collaborative growth.
          </p>
        </div>

        {/* 6 Key Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={pt.title}
                className="p-8 rounded-3xl bg-gray-50/80 hover:bg-white border border-gray-200/80 hover:border-indigo-400 hover:shadow-xl transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-extrabold text-indigo-200 group-hover:text-indigo-600 transition-colors">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {pt.title}
                  </h3>

                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {pt.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                  <span>Verified Advantage</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-900 via-indigo-950 to-gray-900 p-10 rounded-3xl text-white shadow-2xl space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Build Your Network in Your Niche?
          </h3>
          <p className="text-base text-indigo-200 max-w-2xl mx-auto">
            Join thousands of developers, designers, product leads, and founders today. Free to get started.
          </p>
          <div className="flex justify-center pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Join NicheLink Now</span>
              <ArrowRight className="w-5 h-5 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
