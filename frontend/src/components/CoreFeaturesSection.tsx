import React, { useState } from 'react';
import { 
  User, Users, MessageSquareCode, FileText, Briefcase, Rocket, 
  MessageCircle, Bell, FileUp, Award, Search, Bookmark, CheckCircle2, Sparkles
} from 'lucide-react';

export const CoreFeaturesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'networking' | 'opportunity' | 'productivity'>('all');

  const features = [
    {
      id: 'profile',
      icon: User,
      title: 'Professional Profiles',
      description: 'Highlight your biography, experience timeline, verified skills, portfolio links, and education credentials.',
      category: 'networking',
      tag: 'Identity',
    },
    {
      id: 'networking',
      icon: Users,
      title: 'Smart Networking',
      description: 'Connect directly with developers, designers, product leads, and founders sharing your exact stack or goals.',
      category: 'networking',
      tag: 'Connections',
    },
    {
      id: 'communities',
      icon: MessageSquareCode,
      title: 'Niche Communities',
      description: 'Join or create dedicated community spaces with targeted feeds, discussions, and event channels.',
      category: 'networking',
      tag: 'Hubs',
    },
    {
      id: 'feed',
      icon: FileText,
      title: 'Posts & Feed',
      description: 'Share tech updates, code snippets, industry insights, or ask questions with markdown and media support.',
      category: 'networking',
      tag: 'Social',
    },
    {
      id: 'jobs',
      icon: Briefcase,
      title: 'Niche Jobs Board',
      description: 'Browse remote, hybrid, and specialized roles matched automatically to your verified skills profile.',
      category: 'opportunity',
      tag: 'Careers',
    },
    {
      id: 'projects',
      icon: Rocket,
      title: 'Projects & Collabs',
      description: 'Post open source or startup projects, set required roles, track progress, and recruit team members.',
      category: 'opportunity',
      tag: 'Build',
    },
    {
      id: 'messaging',
      icon: MessageCircle,
      title: 'Direct Messaging',
      description: 'Real-time 1-on-1 private messaging and group chats with rich attachment & code snippet support.',
      category: 'productivity',
      tag: 'Chat',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Real-Time Notifications',
      description: 'Instant alerts for job matches, project invites, connection requests, mentions, and post reactions.',
      category: 'productivity',
      tag: 'Alerts',
    },
    {
      id: 'documents',
      icon: FileUp,
      title: 'Files & Documents',
      description: 'Attach PDFs, pitch decks, resumes, and code samples directly to posts, jobs, or project rooms.',
      category: 'productivity',
      tag: 'Files',
    },
    {
      id: 'skills',
      icon: Award,
      title: 'Skills & Experience',
      description: 'Endorsements and skill verification badges that give recruiters and collaborators verified proof.',
      category: 'networking',
      tag: 'Proof',
    },
    {
      id: 'search',
      icon: Search,
      title: 'Global Niche Search',
      description: 'Filter professionals, communities, jobs, or projects by exact technologies, location, or availability.',
      category: 'productivity',
      tag: 'Discovery',
    },
    {
      id: 'bookmark',
      icon: Bookmark,
      title: 'Save & Bookmark',
      description: 'Save interesting posts, job listings, open projects, or profiles to review whenever you want.',
      category: 'productivity',
      tag: 'Organize',
    },
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  return (
    <section className="py-20 bg-gray-50/70 border-y border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Core Features Built for Your Growth
          </h2>
          <p className="text-base text-gray-600">
            Everything you need to showcase your identity, join niche groups, land top opportunities, and collaborate seamlessly.
          </p>

          {/* Filter pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[
              { id: 'all', label: 'All 12 Features' },
              { id: 'networking', label: 'Networking & Profiles' },
              { id: 'opportunity', label: 'Jobs & Projects' },
              { id: 'productivity', label: 'Tools & Messaging' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Features Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center text-[11px] font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  <span>Integrated & Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
