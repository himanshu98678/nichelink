import React, { useState } from 'react';
import { sampleCommunities } from '../data/mockData';
import { ArrowRight } from 'lucide-react';
import { CommunityCard } from './CommunityCard';

interface CommunitiesShowcaseProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const CommunitiesShowcase: React.FC<CommunitiesShowcaseProps> = ({ onOpenAuth }) => {
  const [joinedState, setJoinedState] = useState<Record<string, boolean>>({ 'saas-developers': true, 'ai-engineers': true });

  const toggleJoin = (id: string) => {
    setJoinedState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section id="communities" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Niche Discussion Groups
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Communities Tailored to Your Stack & Role
            </h2>
            <p className="text-base text-gray-600">
              Join focused spaces where verified experts, practitioners, and learners share knowledge, host workshops, and collaborate on real code.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="self-start md:self-auto px-6 py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-sm shadow-md hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <span>Explore All Communities</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Communities Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleCommunities.slice(0, 4).map((comm) => (
            <CommunityCard
              key={comm.id}
              community={comm}
              isJoined={!!joinedState[comm.id]}
              onToggleJoin={toggleJoin}
              showDetailLink={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

