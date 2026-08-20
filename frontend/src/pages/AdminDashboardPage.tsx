import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Globe2, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Sliders, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Lock, 
  Sparkles, 
  Bell, 
  ExternalLink,
  Crown,
  Shield,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, Community, Post, UserProfile } from '../types';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const {
    userRole,
    setUserRole,
    communities,
    addCommunity,
    editCommunity,
    deleteCommunity,
    posts,
    editPost,
    deletePost,
    deleteComment,
    allUsers,
    updateUserRole,
    deleteUser,
    platformSettings,
    updatePlatformSettings,
    isAdmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'communities' | 'posts' | 'comments' | 'subscriptions' | 'settings'>('overview');

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  const [commSearch, setCommSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');

  // Modals / forms
  const [isAddCommOpen, setIsAddCommOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommCategory, setNewCommCategory] = useState('Engineering');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommTags, setNewCommTags] = useState('Remote, Tech');
  const [newCommIsPro, setNewCommIsPro] = useState(false);

  // Edit Post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');

  // Platform banner state
  const [bannerText, setBannerText] = useState(platformSettings.announcementBanner.text);
  const [bannerEnabled, setBannerEnabled] = useState(platformSettings.announcementBanner.enabled);
  const [maintenanceMode, setMaintenanceMode] = useState(platformSettings.maintenanceMode);
  const [proPrice, setProPrice] = useState(platformSettings.proPriceMonthly);

  // Filtered lists
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.userRole === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(commSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(commSearch.toLowerCase())
  );

  const filteredPosts = posts.filter((p) =>
    p.content.toLowerCase().includes(postSearch.toLowerCase()) ||
    p.author.name.toLowerCase().includes(postSearch.toLowerCase()) ||
    (p.communityName && p.communityName.toLowerCase().includes(postSearch.toLowerCase()))
  );

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    addCommunity({
      name: newCommName.trim(),
      category: newCommCategory,
      description: newCommDesc.trim() || 'A premier micro-tribe for async remote specialists.',
      tags: newCommTags.split(',').map((t) => t.trim()).filter(Boolean),
      isProOnly: newCommIsPro,
      memberCount: '1 Member',
      activeNowCount: '1 Active',
    });

    setNewCommName('');
    setNewCommDesc('');
    setIsAddCommOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings({
      announcementBanner: {
        ...platformSettings.announcementBanner,
        enabled: bannerEnabled,
        text: bannerText,
      },
      maintenanceMode,
      proPriceMonthly: Number(proPrice),
    });
    alert('Platform system settings updated successfully!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Admin Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">NicheLink SuperAdmin Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Root RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full platform control, user moderation, community curation & Stripe telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isAdmin && (
              <button
                onClick={() => setUserRole('Admin')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Switch to Admin Mode</span>
              </button>
            )}
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Back to App Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-3">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
            { id: 'users', label: 'Users & Roles', icon: Users, badge: allUsers.length },
            { id: 'communities', label: 'Communities', icon: Globe2, badge: communities.length },
            { id: 'posts', label: 'Posts & Feeds', icon: FileText, badge: posts.length },
            { id: 'comments', label: 'Comments Moderation', icon: MessageSquare },
            { id: 'subscriptions', label: 'Subscriptions (Stripe)', icon: CreditCard },
            { id: 'settings', label: 'Platform Controls', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total MRR</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">$19,450</div>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% this month</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Pro Members</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">1,024</div>
                <div className="flex items-center space-x-1.5 text-xs text-indigo-400">
                  <span>84% retention rate</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Micro-Tribes</span>
                  <Globe2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{communities.length}</div>
                <div className="text-xs text-slate-400">
                  Across 6 core engineering verticals
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Posts & Discussions</span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">{posts.length}</div>
                <div className="text-xs text-emerald-400">
                  98.6% positive community signal
                </div>
              </div>
            </div>

            {/* Platform Health and Quick Control */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Real-Time Platform Pulse</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-xs font-bold text-white">Socket.io Messaging Cluster</div>
                        <div className="text-[11px] text-slate-400">14 active micro-rooms, avg latency 18ms</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <div className="text-xs font-bold text-white">Stripe Webhook Listeners</div>
                        <div className="text-[11px] text-slate-400">customer.subscription.created, invoice.paid</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CONNECTED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <div>
                        <div className="text-xs font-bold text-white">RBAC Security Engine</div>
                        <div className="text-[11px] text-slate-400">Guest | FreeMember | ProMember | Admin</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      ENFORCING
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Management</h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab('communities')}
                    className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-left text-xs font-semibold rounded-xl flex items-center justify-between text-slate-200 transition-all cursor-pointer"
                  >
                    <span>Create New Micro-Tribe</span>
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-left text-xs font-semibold rounded-xl flex items-center justify-between text-slate-200 transition-all cursor-pointer"
                  >
                    <span>Audit User Roles</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-left text-xs font-semibold rounded-xl flex items-center justify-between text-slate-200 transition-all cursor-pointer"
                  >
                    <span>Edit Global Announcement</span>
                    <Bell className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* USERS & ROLES TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, handle, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Role filter:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="all">All Roles ({allUsers.length})</option>
                  <option value="Admin">Admin</option>
                  <option value="ProMember">ProMember</option>
                  <option value="FreeMember">FreeMember</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Current Role</th>
                      <th className="p-4">Company / Location</th>
                      <th className="p-4">Skills</th>
                      <th className="p-4 text-right">RBAC Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              {u.userRole === 'ProMember' && (
                                <Crown className="w-3 h-3 text-amber-400" />
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">{u.username} • {u.email || 'user@nichelink.io'}</div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.userRole === 'Admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : u.userRole === 'ProMember'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {u.userRole}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="text-white font-medium">{u.company || 'Independent Builder'}</div>
                          <div className="text-slate-400 text-[11px]">{u.location || 'Remote Worldwide'}</div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.skills.slice(0, 3).map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <select
                              value={u.userRole}
                              onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                              className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none"
                            >
                              <option value="Guest">Guest</option>
                              <option value="FreeMember">FreeMember</option>
                              <option value="ProMember">ProMember</option>
                              <option value="Admin">Admin</option>
                            </select>

                            <button
                              onClick={() => {
                                if (confirm(`Remove user ${u.name}?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COMMUNITIES MANAGEMENT TAB */}
        {activeTab === 'communities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search micro-tribes by name or category..."
                  value={commSearch}
                  onChange={(e) => setCommSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setIsAddCommOpen(!isAddCommOpen)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tribe</span>
              </button>
            </div>

            {/* Add Community Form Drawer */}
            {isAddCommOpen && (
              <form onSubmit={handleCreateCommunity} className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Provision New Micro-Community</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tribe Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Rust Systems"
                      value={newCommName}
                      onChange={(e) => setNewCommName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <select
                      value={newCommCategory}
                      onChange={(e) => setNewCommCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="AI & ML">AI & ML</option>
                      <option value="Founders & SaaS">Founders & SaaS</option>
                      <option value="Design">Design</option>
                      <option value="Product">Product</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="High signal discussion on async actors, Tokio runtime, memory allocation..."
                      value={newCommDesc}
                      onChange={(e) => setNewCommDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="Rust, Tokio, Async, Systems"
                      value={newCommTags}
                      onChange={(e) => setNewCommTags(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <input
                      type="checkbox"
                      id="proOnly"
                      checked={newCommIsPro}
                      onChange={(e) => setNewCommIsPro(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="proOnly" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Pro Member Exclusive Tribe
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCommOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Publish Tribe
                  </button>
                </div>
              </form>
            )}

            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommunities.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      {c.isProOnly && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PRO ONLY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-indigo-400 font-semibold">{c.category}</div>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                    
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 font-medium">
                      {c.memberCount || '100+ Members'}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editCommunity(c.id, { isProOnly: !c.isProOnly })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          c.isProOnly 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {c.isProOnly ? 'Make Free' : 'Make Pro'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete community ${c.name}?`)) {
                            deleteCommunity(c.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer transition-colors"
                        title="Delete community"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS & FEEDS MODERATION TAB */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter posts by content or author..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <span className="text-xs text-slate-400">{filteredPosts.length} total posts active</span>
            </div>

            <div className="space-y-4">
              {filteredPosts.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.author.avatar}
                        alt={p.author.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>{p.author.name}</span>
                          <span className="text-slate-500 font-normal">{p.author.username}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          in <span className="text-indigo-400 font-semibold">{p.communityName || 'General Hub'}</span> • {p.timeAgo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {p.isProOnly && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PRO
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingPostId(p.id);
                          setEditPostContent(p.content);
                        }}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-colors"
                        title="Edit post content"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this post permanently?')) {
                            deletePost(p.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingPostId === p.id ? (
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            editPost(p.id, editPostContent);
                            setEditingPostId(null);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                  )}

                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt="Attachment"
                      className="max-h-48 rounded-xl object-cover border border-slate-800"
                    />
                  )}

                  <div className="flex items-center space-x-4 pt-2 text-[11px] text-slate-500 border-t border-slate-800/60">
                    <span>❤️ {p.likes} upvotes</span>
                    <span>💬 {p.comments || 0} comments</span>
                    <span>🏷️ {p.tags.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMENTS MODERATION TAB */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="text-xs font-bold text-white">Live Comments Queue & Moderation</div>
              <span className="text-xs text-slate-400">Instant one-click deletion for spam filtering</span>
            </div>

            <div className="space-y-3">
              {posts.flatMap((p) =>
                (p.commentList || []).map((c) => ({
                  ...c,
                  postId: p.id,
                  postAuthor: p.author.name,
                }))
              ).map((comment) => (
                <div key={comment.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-white">{comment.author.name}</span>
                      <span className="text-slate-500">{comment.author.username}</span>
                      <span className="text-[10px] text-slate-600">• {comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{comment.text}</p>
                    <div className="text-[10px] text-indigo-400">
                      On post by {comment.postAuthor}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Delete this comment?')) {
                        deleteComment(comment.postId, comment.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer transition-colors"
                    title="Remove comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS & STRIPE TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Estimated Monthly Run-rate</span>
                <div className="text-2xl font-black text-emerald-400">$19,456.00</div>
                <div className="text-[11px] text-slate-400">Based on $19/mo per seat</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Avg Churn Rate</span>
                <div className="text-2xl font-black text-indigo-400">1.2%</div>
                <div className="text-[11px] text-emerald-400">Industry leading remote retention</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Payment Processor</span>
                <div className="text-2xl font-black text-purple-400">Stripe Billing</div>
                <div className="text-[11px] text-slate-400">Webhook sync v2024-06-20</div>
              </div>
            </div>

            {/* Recent Simulated Transactions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Stripe Invoices</h3>
              <div className="space-y-2">
                {[
                  { id: 'in_1294', user: 'David Kim', plan: 'NicheLink Pro Monthly', amount: '$19.00', status: 'Paid', date: 'Today, 09:24 AM' },
                  { id: 'in_1293', user: 'Sarah Chen', plan: 'NicheLink Pro Monthly', amount: '$19.00', status: 'Paid', date: 'Today, 07:11 AM' },
                  { id: 'in_1292', user: 'Marcus Vance', plan: 'NicheLink Pro Monthly', amount: '$19.00', status: 'Paid', date: 'Yesterday' },
                  { id: 'in_1291', user: 'Alex Vance', plan: 'NicheLink Pro Monthly', amount: '$19.00', status: 'Paid', date: '2 days ago' },
                ].map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/60 text-xs">
                    <div>
                      <div className="font-bold text-white">{tx.user}</div>
                      <div className="text-[11px] text-slate-400">{tx.plan} • Invoice #{tx.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{tx.amount}</div>
                      <div className="text-[10px] text-slate-500">{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM CONTROLS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 max-w-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Platform Control & Feature Flags</span>
            </h3>

            <div className="space-y-4">
              
              {/* Announcement Banner */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase">Global Announcement Banner</label>
                  <input
                    type="checkbox"
                    checked={bannerEnabled}
                    onChange={(e) => setBannerEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-700"
                  />
                </div>
                <textarea
                  rows={2}
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-bold text-white">Emergency Maintenance Mode</div>
                  <div className="text-[11px] text-slate-400">Temporarily restrict posting to superadmins only</div>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded bg-slate-950 border-slate-700"
                />
              </div>

              {/* Pro Price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Monthly Pro Subscription Price ($ USD)</label>
                <input
                  type="number"
                  value={proPrice}
                  onChange={(e) => setProPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs"
                />
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
              >
                Save System Settings
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
