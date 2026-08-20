import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, Plus, Search, Sparkles, Flame, 
  Heart, Rocket, Bookmark, Share2, Check, ArrowRight, 
  Send, Lock, ShieldCheck, Zap, Globe, Briefcase, Code2, 
  Filter, CheckCircle2, MoreHorizontal, MoreVertical, ExternalLink, RefreshCw, Camera,
  TrendingUp, Radio, Award, Edit3, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
import { api } from '../services/api';
import { sampleProjects } from '../data/mockData';
import { Post } from '../types';
import { CommunityCard } from '../components/CommunityCard';
import { NestedComments } from '../components/NestedComments';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { EditPostModal } from '../components/EditPostModal';
import { DeletePostModal } from '../components/DeletePostModal';
import { sanitizeHtml } from '../utils/sanitize';
import { DashboardAnalyticsPanel } from '../components/DashboardAnalyticsPanel';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    userRole, 
    isFreeMember, 
    isProMember, 
    isAdmin, 
    isGuest,
    joinedCommunityIds,
    addComment, 
    likeComment,
    setIsCreatePostOpen,
    setIsCheckoutOpen,
    setIsAvatarModalOpen
  } = useAuth();

  const {
    communities,
    isCommunityJoined,
    toggleJoinCommunity
  } = useCommunity();

  const {
    posts,
    isLoading: isPostLoading,
    fetchPosts,
    addPost,
    toggleLikePost,
    toggleSavePost
  } = usePost();

  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'messages' | 'projects' | 'pro'>('feed');
  const [selectedFeedCommunity, setSelectedFeedCommunity] = useState<string>('all');
  const [postSearch, setPostSearch] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>('post_1');
  const [quickPostContent, setQuickPostContent] = useState('');
  const [quickPostCommunity, setQuickPostCommunity] = useState('saas-developers');
  const [copiedLinkPostId, setCopiedLinkPostId] = useState<string | null>(null);

  // Edit / Delete Post State
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  const [conversationsCount, setConversationsCount] = useState<number>(3);
  const [projectsCount, setProjectsCount] = useState<number>(sampleProjects.length);

  React.useEffect(() => {
    if (!isGuest) {
      api.get<{ items?: any[] }>('/conversations?limit=50')
        .then((res) => {
          if (res.items) setConversationsCount(res.items.length);
        })
        .catch(() => {});

      api.get<{ projects?: any[]; items?: any[] }>('/projects?limit=50')
        .then((res) => {
          const list = res.projects || res.items;
          if (list) setProjectsCount(list.length);
        })
        .catch(() => {});
    }
  }, [isGuest]);

  // Permission Logic: Show Edit/Delete only when author or Admin
  const canManagePost = (post: Post) => {
    if (isAdmin || userRole === 'Admin') return true;
    if (!user) return false;
    return (
      post.author.username === user.username ||
      post.author.name === user.name ||
      (post.author.id && post.author.id === user.id)
    );
  };

  // Sync posts when community filter changes
  React.useEffect(() => {
    if (selectedFeedCommunity === 'all') {
      fetchPosts();
    } else {
      fetchPosts({ communityId: selectedFeedCommunity });
    }
  }, [selectedFeedCommunity]);

  // Filtered posts based on selected community & search
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(postSearch.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(postSearch.toLowerCase()));
    return matchesSearch;
  });

  // Joined communities objects
  const joinedCommunitiesList = communities.filter(c => c.isJoined);

  const handleQuickPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostContent.trim()) return;

    try {
      await addPost({
        content: quickPostContent.trim(),
        communityId: quickPostCommunity || undefined,
        tags: ['Discussion', 'BuildInPublic'],
        isProOnly: false,
      });
      setQuickPostContent('');
    } catch (err: any) {
      console.error('Failed to publish quick post:', err);
    }
  };

  const handleSharePost = (postId: string) => {
    setCopiedLinkPostId(postId);
    navigator.clipboard?.writeText?.(window.location.origin + `/dashboard?post=${postId}`);
    setTimeout(() => setCopiedLinkPostId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header / Profile Command Center Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/70 via-slate-50/30 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User Greeting & Persona Info */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="relative block rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-transform active:scale-95 cursor-pointer"
                  title="Click to change profile picture"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>

                {/* Edit Photo Floating Button */}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-6 h-6 rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-white shadow-sm absolute -bottom-1 -right-1 flex items-center justify-center transition-colors cursor-pointer"
                  title="Change Profile Photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back, {user.name.split(' ')[0]}!
                  </h1>
                  <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${
                    userRole === 'ProMember' ? 'bg-indigo-600 text-white border-indigo-500' :
                    userRole === 'Admin' ? 'bg-purple-700 text-white border-purple-600' :
                    userRole === 'FreeMember' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {userRole}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  {user.role} • {user.location}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {user.skills?.slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Post</span>
              </button>

              {isFreeMember && (
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 4 Statistical Performance Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Joined Tribes</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{joinedCommunityIds.length}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Active in feed
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Feed Discussions</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{posts.length}</h3>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center">
                <Flame className="w-3 h-3 mr-1" /> Active discussions
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Socket DMs</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{conversationsCount}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Live peer chats
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Project Matches</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{projectsCount}</h3>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5 flex items-center">
                <Briefcase className="w-3 h-3 mr-1" /> Open requests
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Briefcase className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        <DashboardAnalyticsPanel />

        {/* Main Dashboard Layout with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left SaaS Sidebar */}
          <DashboardSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            className="hidden lg:block"
          />

          {/* Right Main Content Panel */}
          <div className="flex-1 w-full space-y-6">

            {/* Dashboard Sub-Tabs Navigation for Quick Switching */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 overflow-x-auto gap-4">
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'feed'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Community Feed</span>
                </button>

                <button
                  onClick={() => setActiveTab('communities')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'communities'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Explore Tribes ({communities.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'messages'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Direct Messages</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'projects'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-purple-500" />
                  <span>Project Match</span>
                </button>

                <button
                  onClick={() => setActiveTab('pro')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'pro'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                      : 'text-indigo-600 hover:bg-indigo-50 font-bold'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Pro Perks</span>
                </button>
              </div>
            </div>

        {/* ======================================================== */}
        {/* TAB 1: COMMUNITY FEED (Posts, Comments, Reactions) */}
        {/* ======================================================== */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Main Feed Stream */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Quick Post Creator Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">Share with your micro-tribe</h3>
                    <p className="text-[11px] text-slate-500">Ask a technical question, share a launch, or post a code snippet.</p>
                  </div>
                  
                  {/* Tribe Selector */}
                  <select
                    value={quickPostCommunity}
                    onChange={(e) => setQuickPostCommunity(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleQuickPostSubmit} className="space-y-3">
                  <textarea
                    rows={2}
                    value={quickPostContent}
                    onChange={(e) => setQuickPostContent(e.target.value)}
                    placeholder={`What are you working on in ${communities.find(c => c.id === quickPostCommunity)?.name || 'the community'}?`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px] font-medium">#Discussion</span>
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px] font-medium">#BuildInPublic</span>
                    </div>

                    <button
                      type="submit"
                      disabled={!quickPostContent.trim()}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post to Tribe</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
                {/* Community Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setSelectedFeedCommunity('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedFeedCommunity === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Feeds ({posts.length})
                  </button>

                  {joinedCommunitiesList.map((comm) => (
                    <button
                      key={comm.id}
                      onClick={() => setSelectedFeedCommunity(comm.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedFeedCommunity === comm.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {comm.name}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Post List */}
              <div className="space-y-6">
                {isPostLoading ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading discussions feed...</span>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center text-xs text-slate-500 font-bold">
                    No posts yet. Be the first to start a discussion.
                  </div>
                ) :
                  filteredPosts.map((post) => {
                    const isCommentsOpen = expandedCommentsPostId === post.id;
                    const community = communities.find(c => c.id === post.communityId);

                    return (
                      <div
                        key={post.id}
                        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4"
                      >
                      {/* Post Author & Tribe Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-slate-900">{post.author.name}</span>
                              <span className="text-[11px] text-slate-500">{post.author.username}</span>
                              {post.author.userRole && (
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  post.author.userRole === 'ProMember' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {post.author.userRole}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 space-x-2 mt-0.5">
                              <span>{post.timeAgo}</span>
                              {community && (
                                <>
                                  <span>•</span>
                                  <Link
                                    to={`/communities/${community.id}`}
                                    className="font-bold text-indigo-600 hover:underline flex items-center"
                                  >
                                    <span>in {community.name}</span>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {post.isProOnly && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center">
                              <Lock className="w-3 h-3 mr-1 text-amber-600" />
                              Pro Discussion
                            </span>
                          )}

                          {/* Post ⋮ Three-Dot Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                              title="Post options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuPostId === post.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveMenuPostId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                                  {canManagePost(post) ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuPostId(null);
                                          setEditingPost(post);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2 transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Edit Post</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuPostId(null);
                                          setDeletingPost(post);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Delete Post</span>
                                      </button>
                                      <div className="my-1 border-t border-slate-100" />
                                    </>
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuPostId(null);
                                      navigator.clipboard?.writeText(window.location.href);
                                      setCopiedLinkPostId(post.id);
                                      setTimeout(() => setCopiedLinkPostId(null), 2000);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{copiedLinkPostId === post.id ? 'Copied Link!' : 'Share Post'}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Post Body */}
                      <div 
                        className="text-sm sm:text-base text-slate-800 leading-relaxed rich-text-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                      />

                      {/* Optional Image */}
                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80">
                          <img src={post.imageUrl} alt="Post attachment" className="w-full object-cover" />
                        </div>
                      )}

                      {/* Post Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Reactions & Interaction Controls */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
                        <div className="flex items-center space-x-4">
                          {/* Like / Heart */}
                          <button
                            onClick={() => toggleLikePost(post.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              post.isLiked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-600' : ''}`} />
                            <span>{post.likes}</span>
                          </button>

                          {/* Comments Toggle */}
                          <button
                            onClick={() => setExpandedCommentsPostId(isCommentsOpen ? null : post.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              isCommentsOpen ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments} Comments</span>
                          </button>

                          {/* Bookmark */}
                          <button
                            onClick={() => toggleSavePost(post.id)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                              post.isSaved ? 'text-indigo-600' : 'hover:bg-slate-100 text-slate-500'
                            }`}
                            title="Bookmark post"
                          >
                            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-indigo-600' : ''}`} />
                          </button>
                        </div>

                        {/* Share */}
                        <button
                          onClick={() => handleSharePost(post.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{copiedLinkPostId === post.id ? 'Copied!' : 'Share'}</span>
                        </button>
                      </div>

                      {/* Recursive Threaded Comments Component */}
                      {isCommentsOpen && (
                        <NestedComments postId={post.id} />
                      )}
                    </div>
                  );
                })}

                {filteredPosts.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                    <Flame className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900">No posts found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Be the first to share an update or question with your joined micro-tribes!
                    </p>
                    <button
                      onClick={() => setIsCreatePostOpen(true)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                    >
                      + Create First Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar: Joined Hubs, Online Peers, Trending */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Joined Communities Summary Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center">
                    <Globe className="w-4 h-4 mr-1.5 text-indigo-600" />
                    <span>My Joined Tribes ({joinedCommunitiesList.length})</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('communities')}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Explore All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {joinedCommunitiesList.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-100 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <Link to={`/communities/${comm.id}`} className="text-xs font-bold text-slate-900 hover:text-indigo-600 block">
                          {comm.name}
                        </Link>
                        <span className="text-[10px] text-slate-500">{comm.members}</span>
                      </div>

                      <Link
                        to={`/communities/${comm.id}`}
                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        Feed →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Verified Peers */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    <span>Online in Your Tribes</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'David Kim', role: 'Staff AI Architect', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', tribe: 'AI Engineers' },
                    { name: 'Sarah Chen', role: 'PyTorch Lead', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', tribe: 'AI Engineers' },
                    { name: 'Marcus Vance', role: 'Product Designer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', tribe: 'UI/UX Designers' },
                  ].map((peer, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50">
                      <div className="flex items-center space-x-2.5">
                        <img src={peer.avatar} alt={peer.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{peer.name}</h4>
                          <span className="text-[10px] text-slate-500">{peer.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/messages')}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg hover:bg-indigo-100 cursor-pointer"
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Upgrade Promotion (if Free Member) */}
              {isFreeMember && (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Unlock NicheLink Pro</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Get unlimited Socket.io DMs, join Pro Exclusive Tribes (AI Engineers, Startup Founders), and post collaboration matches.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Open Billing & Subscription</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EXPLORE COMMUNITIES */}
        {/* ======================================================== */}
        {activeTab === 'communities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Explore Micro-Tribes</h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Join high-signal communities to customize your dashboard feed and message verified peers.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {joinedCommunityIds.length} Joined
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {communities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isJoined={isCommunityJoined(community.id)}
                  onToggleJoin={toggleJoinCommunity}
                  showDetailLink={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DIRECT MESSAGES (Socket.io) */}
        {/* ======================================================== */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    Real-time Socket.io
                  </span>
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    Connected
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Peer Direct Messages</h2>
              </div>

              <Link
                to="/messages"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <span>Full Chat View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* In-Dashboard Chat Teaser */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', msg: 'Let me know when you can test the hybrid RAG retrieval pipeline!', time: '10:45 AM', online: true },
                { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', msg: 'Shared the benchmark weights in the AI & Machine Learning community.', time: 'Yesterday', online: true },
                { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', msg: 'Figma components updated with dark/light SaaS tokens.', time: '2 days ago', online: false },
              ].map((c, i) => (
                <div
                  key={i}
                  onClick={() => navigate('/messages')}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/60 rounded-2xl border border-slate-200/80 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      {c.online && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white absolute bottom-0 right-0" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      <span className="text-[10px] text-slate-400">{c.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 italic">"{c.msg}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PROJECT MATCH */}
        {/* ======================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Project Matchboard</h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Find verified remote co-builders, join open source repositories, and launch micro-ventures.
                </p>
              </div>

              <Link
                to="/projects"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Browse All Projects →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sampleProjects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100">
                      {proj.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {proj.spotsOpen} Spots Open
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{proj.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {proj.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={proj.lead.avatar} alt={proj.lead.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-medium text-slate-600">Lead: {proj.lead.name}</span>
                    </div>

                    <Link
                      to="/projects"
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
                    >
                      Apply to Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PRO UPGRADE & STRIPE STATUS */}
        {/* ======================================================== */}
        {activeTab === 'pro' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-8 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Monetization & Tier Status
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">NicheLink Pro Membership</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Unlock unrestricted access across all micro-tribes, unlimited Socket.io DMs, and Project Match posting.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Current Plan Status</h4>
                  <p className="text-xs text-slate-500">Active role: <strong className="text-slate-900">{userRole}</strong></p>
                </div>

                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  isProMember ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  {isProMember ? 'Pro Active ⚡' : 'Free Tier'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Access to all 8 micro-tribes</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Unlimited Socket.io real-time DMs</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Pro-exclusive discussions & AMAs</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Post Project Matches as Team Lead</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Payment checkout is available when the server-side Stripe configuration is enabled.
              </div>

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isProMember ? 'View Billing Status' : 'Open Billing Setup'}</span>
              </button>
            </div>
          </div>
        )}

          </div>
        </div>

        {/* Edit Post Modal */}
        <EditPostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
        />

        {/* Delete Post Modal */}
        <DeletePostModal
          isOpen={!!deletingPost}
          onClose={() => setDeletingPost(null)}
          post={deletingPost}
        />

      </div>
    </div>
  );
};
