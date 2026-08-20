import React from 'react';
import { ShieldCheck, Users, FolderKanban, Briefcase, Zap, CheckCircle2 } from 'lucide-react';

export const SocialProofSection: React.FC = () => {
  const proofCategories = [
    {
      title: 'Professionals Joined',
      status: 'Verified & Active',
      description: 'Engineers, designers, researchers, and founders building modern digital products.',
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    },
    {
      title: 'Communities',
      status: 'Curated Niche Hubs',
      description: 'Specialized spaces for Web Development, AI/ML, UI/UX, and Venture Building.',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200/80',
    },
    {
      title: 'Projects & Collabs',
      status: 'Open Collaboration',
      description: 'Cross-functional open source and early-stage startup collaboration rooms.',
      icon: FolderKanban,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    },
    {
      title: 'Jobs & Opportunities',
      status: 'Handpicked Roles',
      description: 'Direct matches with innovative companies hiring for niche skillsets.',
      icon: Briefcase,
      color: 'text-purple-600 bg-purple-50 border-purple-200/80',
    },
    {
      title: 'Active Members',
      status: 'Live Real-Time Activity',
      description: 'Direct member-to-member conversations, post reviews, and mentorship.',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50 border-amber-200/80',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Platform Trust & Verification
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3 tracking-tight">
            Designed for Real Professional Impact
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            No vanity metrics or fake follower counts. Authentic professionals connecting around shared expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {proofCategories.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-gray-50/70 hover:bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                      Active
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-700 mt-1">
                    {item.status}
                  </p>
                </div>

                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
