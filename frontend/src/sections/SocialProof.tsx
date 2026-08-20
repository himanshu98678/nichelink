import React from 'react';

export const SocialProofSection: React.FC = () => {
  const stats = [
    { value: '10K+', label: 'Professionals' },
    { value: '150+', label: 'Communities' },
    { value: '50+', label: 'Countries' },
    { value: '50K+', label: 'Discussions' },
  ];

  return (
    <section className="py-12 bg-white/80 backdrop-blur-[2px] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
