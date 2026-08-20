import React, { useState } from 'react';
import { 
  ArrowRight, Users, Briefcase, FolderKanban, MessageSquare, 
  Sparkles, ShieldCheck, Search, Bell, Heart, Share2, Bookmark,
  TrendingUp, CheckCircle, Flame, Plus, Zap
} from 'lucide-react';
import { samplePosts, sampleCommunities, sampleJobs } from '../data/mockData';

interface HeroSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onExploreCommunities: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth, onExploreCommunities }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'jobs'>('feed');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({ post_2: true });
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({ post_1: 128, post_2: 95 });

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const isLiked = !prev[postId];
      setLikeCounts((counts) => ({
        ...counts,
        [postId]: (counts[postId] || 0) + (isLiked ? 1 : -1),
      }));
      return { ...prev, [postId]: isLiked };
    });
  };

  return (
    <section id="hero" className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-400/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Next-Gen Professional Network & Communities</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-950 tracking-tight leading-[1.08]">
            Build Your Network. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 bg-clip-text text-transparent">
              Find Your Niche.
            </span>{' '}
            Grow Together.
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Connect with professionals, discover opportunities, join communities, and collaborate on meaningful projects.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <span>Join NicheLink</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onExploreCommunities}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-base shadow-xs hover:border-gray-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Explore Communities</span>
            </button>
          </div>

          {/* Quick value indicators */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-medium text-gray-500">
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Verified Member Profiles</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Niche Community Hubs</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Direct Project Collaboration</span>
            </span>
          </div>
        </div>

        {/* Dashboard / Product Preview Mockup */}
        <div className="mt-12 lg:mt-16 relative mx-auto max-w-5xl rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white/90 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl overflow-hidden">
          {/* Mockup Header bar */}
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-medium text-gray-400 font-mono hidden sm:inline">
                nichelink.app/feed
              </span>
            </div>

            {/* Interactive Preview Switcher Tabs */}
            <div className="flex items-center bg-gray-800 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'communities'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Communities
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Jobs
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Preview</span>
              </span>
            </div>
          </div>

          {/* Mockup Body Content */}
          <div className="p-4 sm:p-6 bg-gray-50/60 min-h-[380px]">
            {activeTab === 'feed' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {/* Create post mini input */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                  />
                  <input
                    type="text"
                    readOnly
                    onClick={() => onOpenAuth('signup')}
                    placeholder="Share an update, launch a project, or start a niche discussion..."
                    className="w-full bg-gray-100/80 hover:bg-gray-100 text-gray-600 text-sm rounded-full px-4 py-2.5 cursor-pointer focus:outline-none transition-colors"
                  />
                </div>

                {/* Feed item */}
                {samplePosts.map((post) => (
                  <div key={post.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-sm font-bold text-gray-900">{post.author.name}</h4>
                            <span className="text-xs text-gray-500">{post.author.username}</span>
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          </div>
                          <p className="text-xs text-gray-500">{post.author.role} • {post.timeAgo}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                        Pro
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            likedPosts[post.id] ? 'text-red-500 font-semibold' : 'hover:text-gray-900'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-red-500' : ''}`} />
                          <span>{likeCounts[post.id] || post.likes}</span>
                        </button>
                        <button
                          onClick={() => onOpenAuth('login')}
                          className="flex items-center space-x-1.5 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments} Comments</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-gray-900 transition-colors cursor-pointer">
                          <Share2 className="w-4 h-4" />
                          <span>{post.shares}</span>
                        </button>
                      </div>
                      <button className="hover:text-indigo-600 cursor-pointer">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'communities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {sampleCommunities.map((comm) => (
                  <div key={comm.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:border-indigo-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                          {comm.category}
                        </span>
                        <h4 className="text-base font-bold text-gray-900 mt-2">{comm.name}</h4>
                      </div>
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        {comm.activeNowCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{comm.description}</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {comm.memberCount}
                      </span>
                      <button
                        onClick={() => onOpenAuth('signup')}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                      >
                        Join Community
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-3 max-w-3xl mx-auto">
                {sampleJobs.map((job) => (
                  <div key={job.id} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100 shrink-0">
                        {job.company.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{job.title}</h4>
                        <p className="text-xs text-gray-600 font-medium">{job.company} • {job.location}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                            {job.salary}
                          </span>
                          <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                            {job.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenAuth('signup')}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer self-start sm:self-center shrink-0"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
