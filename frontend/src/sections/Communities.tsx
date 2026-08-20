import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Search, Users, ArrowRight, Check, MessageSquare, 
  Flame, Filter, ShieldCheck, Activity, Send, Heart 
} from 'lucide-react';
import { COMMUNITIES_DATA } from '../data/communities';
import { samplePosts } from '../data/mockData';
import { Button } from '../components/Button';
import { CommunityCard } from '../components/CommunityCard';

export const CommunitiesSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'hubs' | 'feed'>('hubs');
  const [joinedState, setJoinedState] = useState<Record<string, boolean>>({ 'saas-developers': true, 'ai-engineers': true });

  // Post feed state for interactive discussion preview
  const [likes, setLikes] = useState<Record<string, number>>({ post_1: 128, post_2: 94 });
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({ post_2: true });
  const [postComments, setPostComments] = useState<Record<string, Array<{ id: string; user: string; text: string; time: string }>>>({
    post_1: [
      { id: 'c1', user: 'Alex Rivera', text: 'Amazing architecture! How do you handle connection pooling across remote regions?', time: '1h ago' },
      { id: 'c2', user: 'Sarah Chen', text: '@Alex Rivera We rely on distributed edge proxies & async replication, keeping roundtrips under 20ms.', time: '35m ago' },
    ],
  });
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const categories = ['All', 'Engineering', 'AI & Data', 'Design', 'Lifestyle', 'Content & Docs', 'Business'];

  const filteredCommunities = useMemo(() => {
    return COMMUNITIES_DATA.filter((comm) => {
      const matchesCategory = selectedCategory === 'All' || comm.category === selectedCategory;
      const matchesSearch = 
        comm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleJoin = (id: string) => {
    setJoinedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLike = (postId: string) => {
    setIsLiked((prev) => {
      const active = !prev[postId];
      setLikes((c) => ({
        ...c,
        [postId]: (c[postId] || 0) + (active ? 1 : -1),
      }));
      return { ...prev, [postId]: active };
    });
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment[postId];
    if (!text) return;

    setPostComments((prev) => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        { id: Date.now().toString(), user: 'You (Visitor)', text, time: 'Just now' },
      ],
    }));

    setNewComment((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <section id="communities" className="py-16 sm:py-24 bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/80 border-b border-slate-200/80 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>50+ GLOBAL REMOTE TECH HUBS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Active Remote Communities Hub
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover verified asynchronous hubs built around your technical stack, remote workflow, and professional goals.
          </p>
        </div>

        {/* Dashboard Frame Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-8 space-y-8">
          
          {/* Top Control Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            
            {/* View Mode Toggle Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start lg:self-auto">
              <button
                onClick={() => setActiveTab('hubs')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'hubs'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Featured Hubs ({filteredCommunities.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'feed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Live Discussion Feed</span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hubs by stack, skill, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Live Indicator Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>3,420 Remote Members Live Now</span>
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Categories:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tab 1: Community Cards Grid */}
          {activeTab === 'hubs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isJoined={!!joinedState[community.id]}
                    onToggleJoin={toggleJoin}
                    showDetailLink={true}
                  />
                ))}
              </div>


              {filteredCommunities.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-sm text-slate-500 font-medium">No active hubs found matching your criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Discussion Feed Preview */}
          {activeTab === 'feed' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {samplePosts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">{post.author.name}</h4>
                          <span className="text-xs text-slate-400">{post.author.username}</span>
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{post.author.role} • {post.timeAgo}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                      Verified Practitioner
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          isLiked[post.id] ? 'text-red-500 font-bold' : 'hover:text-slate-900'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked[post.id] ? 'fill-red-500' : ''}`} />
                        <span>{likes[post.id] || post.likes} Likes</span>
                      </button>

                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <MessageSquare className="w-4 h-4" />
                        <span>{(postComments[post.id]?.length || 0) + post.comments} Comments</span>
                      </div>
                    </div>
                  </div>

                  {/* Comment Drawer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {(postComments[post.id] || []).map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{c.user}</span>
                          <span className="text-[10px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-slate-700">{c.text}</p>
                      </div>
                    ))}

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        placeholder="Join the peer discussion..."
                        className="w-full px-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Dashboard Stats Bar */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">150+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Hubs</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">50K+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Async Discussions</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">12 mins</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg Response Time</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">98%</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Signal-to-Noise Ratio</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="text-center pt-2">
            <Button to="/communities" variant="outline" size="lg" className="space-x-2">
              <span>Explore All 150+ Remote Communities</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

        </div>

      </div>
    </section>
  );
};

