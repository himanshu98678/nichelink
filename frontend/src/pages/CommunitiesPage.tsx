import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Users, ArrowLeft, MessageSquare, Plus, CheckCircle2, 
  ShieldCheck, Sparkles, Send, Flame, Heart, Bookmark, Share2, 
  Lock, Globe, Briefcase, ExternalLink, Check, UserPlus, MoreVertical, Edit3, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
import { api } from '../services/api';
import { NestedComments } from '../components/NestedComments';
import { sanitizeHtml } from '../utils/sanitize';
import { Post } from '../types';
import { sampleProjects } from '../data/mockData';
import { CommunityCard } from '../components/CommunityCard';
import { EditPostModal } from '../components/EditPostModal';
import { DeletePostModal } from '../components/DeletePostModal';

export const CommunitiesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { 
    user,
    userRole,
    isProMember,
    setIsCreatePostOpen,
    setIsCheckoutOpen,
    addComment,
    likeComment
  } = useAuth();

  const { 
    communities, 
    isLoading: isCommLoading, 
    error: commError,
    fetchCommunities,
    joinCommunity, 
    leaveCommunity, 
    isCommunityJoined,
    fetchMembers
  } = useCommunity();

  const {
    posts,
    isLoading: isPostLoading,
    fetchPosts,
    addPost,
    toggleLikePost,
    toggleSavePost
  } = usePost();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat' | 'members' | 'projects'>('feed');
  const [newPostText, setNewPostText] = useState('');
  const [roomChatText, setRoomChatText] = useState('');
  const [roomMessages, setRoomMessages] = useState<Array<{ sender: string; avatar: string; text: string; time: string }>>([
    { sender: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', text: 'Welcome everyone! What stack are you shipping with this week?', time: '10:30 AM' },
    { sender: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', text: 'Testing vector embeddings latency with HNSW indexing!', time: '10:34 AM' },
  ]);

  const [membersList, setMembersList] = useState<any[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isJoinActionLoading, setIsJoinActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit / Delete Post State
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  const canManagePost = (post: Post) => {
    if (userRole === 'Admin') return true;
    if (!user) return false;
    return (
      post.author.username === user.username ||
      post.author.name === user.name ||
      (post.author.id && post.author.id === user.id)
    );
  };

  const selectedCommunity = id ? communities.find((c) => c.id === id) : null;
  const categories = ['All', 'Engineering', 'AI & Data', 'Design', 'Business', 'Lifestyle', 'Content & Docs'];

  // Load feed posts
  React.useEffect(() => {
    if (id) {
      fetchPosts({ communityId: id });
    } else {
      fetchPosts();
    }
  }, [id]);

  // Load members dynamically
  React.useEffect(() => {
    if (id && communityTab === 'members') {
      setIsMembersLoading(true);
      fetchMembers(id).then(list => {
        setMembersList(list);
        setIsMembersLoading(false);
      });
    }
  }, [id, communityTab]);

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !selectedCommunity) return;

    addPost({
      content: newPostText.trim(),
      communityId: selectedCommunity.id,
      tags: selectedCommunity.tags.slice(0, 2),
      isProOnly: false,
    });
    setNewPostText('');
  };

  const handleJoinToggle = async (communityId: string) => {
    setIsJoinActionLoading(true);
    setActionError(null);
    try {
      if (isCommunityJoined(communityId)) {
        await leaveCommunity(communityId);
      } else {
        await joinCommunity(communityId);
      }
    } catch (err: any) {
      setActionError(api.getFriendlyMessage(err));
    } finally {
      setIsJoinActionLoading(false);
    }
  };

  const handleSendRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomChatText.trim()) return;

    setRoomMessages(prev => [
      ...prev,
      {
        sender: user.name,
        avatar: user.avatar,
        text: roomChatText.trim(),
        time: 'Just now',
      }
    ]);
    setRoomChatText('');
  };

  // If a specific community is selected
  if (selectedCommunity) {
    const isJoined = isCommunityJoined(selectedCommunity.id);
    const communityPosts = posts;

    return (
      <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <Link
            to="/communities"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to All Communities
          </Link>

          {/* Community Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            {selectedCommunity.coverImage && (
              <img src={selectedCommunity.coverImage} alt="" className="w-full h-40 object-cover rounded-2xl" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100 uppercase tracking-wider">
                    {selectedCommunity.category}
                  </span>
                  {selectedCommunity.isProOnly && (
                    <span className="px-2.5 py-0.5 text-xs font-bold text-amber-800 bg-amber-50 rounded-full border border-amber-200 flex items-center">
                      <Lock className="w-3 h-3 mr-1 text-amber-600" />
                      Pro Tribe
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {selectedCommunity.name}
                </h1>
                
                <div className="flex items-center text-xs font-medium text-slate-500 space-x-3">
                  <span className="flex items-center font-bold text-slate-700">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {selectedCommunity.members}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Active Now
                  </span>
                </div>
              </div>

              {/* Join / Leave Toggle Button */}
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={() => handleJoinToggle(selectedCommunity.id)}
                  disabled={isJoinActionLoading}
                  className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm disabled:opacity-60 ${
                    isJoined
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isJoinActionLoading ? 'Leaving...' : 'Joined Community'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isJoinActionLoading ? 'Joining...' : 'Join Micro-Tribe'}</span>
                    </>
                  )}
                </button>
                {actionError && (
                  <p className="text-[10px] font-bold text-rose-600 max-w-[200px] text-right">{actionError}</p>
                )}
              </div>
            </div>

            {/* About & Tags */}
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {selectedCommunity.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {selectedCommunity.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs Bar inside Community Detail */}
            <div className="flex border-b border-slate-200 pt-2 gap-2 overflow-x-auto">
              <button
                onClick={() => setCommunityTab('feed')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  communityTab === 'feed'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Discussions ({communityPosts.length})</span>
              </button>

              <button
                onClick={() => setCommunityTab('chat')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  communityTab === 'chat'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Live Socket.io Room</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => setCommunityTab('members')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  communityTab === 'members'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Members Directory</span>
              </button>

              <button
                onClick={() => setCommunityTab('projects')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  communityTab === 'projects'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Tribe Projects</span>
              </button>
            </div>

            {/* TAB CONTENT 1: DISCUSSIONS / FEED */}
            {communityTab === 'feed' && (
              <div className="space-y-6 pt-2">
                {/* Post Creator */}
                <form onSubmit={handlePostSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-bold text-slate-800">Post a question or launch in {selectedCommunity.name}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Share insights, ask for code review, or initiate a discussion..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newPostText.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Discussion</span>
                    </button>
                  </div>
                </form>

                {/* Posts Stream */}
                <div className="space-y-4">
                  {isPostLoading ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading discussions stream...</span>
                    </div>
                  ) : (
                    communityPosts.map((post) => (
                      <div key={post.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={post.author.avatar} alt={post.author.name} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">{post.author.name}</span>
                                <span className="text-[10px] text-slate-500">{post.author.username}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{post.timeAgo}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleLikePost(post.id)}
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                post.isLiked ? 'bg-rose-100 text-rose-700' : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-rose-600' : ''}`} />
                              <span>{post.likes}</span>
                            </button>

                            {/* Post Options Menu */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
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
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Share Post</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div 
                          className="text-xs sm:text-sm text-slate-800 leading-relaxed rich-text-content"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                        />

                        {/* Optional Image */}
                        {post.imageUrl && (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 my-2">
                            <img src={post.imageUrl} alt="Post attachment" className="w-full object-cover" />
                          </div>
                        )}

                        {/* Nested Comments for this post */}
                        <NestedComments postId={post.id} />
                      </div>
                    ))
                  )}

                  {!isPostLoading && communityPosts.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-700">No discussions posted yet in this tribe.</p>
                      <p className="text-xs text-slate-500">Be the first to share an insight above!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: LIVE SOCKET.IO ROOM */}
            {communityTab === 'chat' && (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Socket.io room connected for <strong>#{selectedCommunity.id}</strong></span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">42 Members Active</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 h-64 overflow-y-auto space-y-3">
                  {roomMessages.map((msg, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs">
                      <img src={msg.avatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{msg.sender}</span>
                          <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-slate-700 mt-0.5">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendRoomMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={roomChatText}
                    onChange={(e) => setRoomChatText(e.target.value)}
                    placeholder={`Message #${selectedCommunity.name}...`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT 3: MEMBERS DIRECTORY */}
            {communityTab === 'members' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {isMembersLoading ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading members directory...</span>
                  </div>
                ) : membersList.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-500 font-semibold">
                    No members in this community yet.
                  </div>
                ) : (
                  membersList.map((memberRelation) => {
                    const m = memberRelation.user;
                    const displayRole = m.role || 'Member';
                    const displayAvatar = m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                    return (
                      <div key={memberRelation.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={displayAvatar} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                            <p className="text-[10px] text-slate-500">{displayRole}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate('/messages')}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 cursor-pointer"
                        >
                          Message
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT 4: TRIBE PROJECTS */}
            {communityTab === 'projects' && (
              <div className="space-y-3 pt-2">
                {sampleProjects.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">{p.category}</span>
                      <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{p.spotsOpen} spots open • Lead: {p.lead.name}</p>
                    </div>

                    <button
                      onClick={() => navigate('/projects')}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      View & Apply
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // ALL COMMUNITIES EXPLORE DIRECTORY VIEW
  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Micro-Communities Directory
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Explore Micro-Tribes
          </h1>
          <p className="text-base text-slate-600">
            Join focused, high-signal spaces for remote builders, SaaS engineers, and digital nomading creators.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tribes by name, skill, or tag (e.g. SaaS, LLMs, Figma)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Community Cards */}
        {isCommLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading community hubs...</span>
          </div>
        ) : commError ? (
          <div className="py-16 text-center text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-3xl max-w-xl mx-auto">
            <p>{commError}</p>
            <button
              onClick={() => fetchCommunities()}
              className="mt-3 px-4 py-2 bg-rose-700 text-white rounded-xl hover:bg-rose-800 transition-colors"
            >
              Retry Load
            </button>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 font-bold bg-white border border-slate-200 rounded-3xl max-w-xl mx-auto">
            No communities available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isJoined={isCommunityJoined(community.id)}
                onToggleJoin={handleJoinToggle}
                showDetailLink={true}
              />
            ))}
          </div>
        )}

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

