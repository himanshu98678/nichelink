import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Compass, Users, MessageSquare, Briefcase, 
  Bell, User, Sparkles, Settings, ShieldCheck, Flame, Plus, Lock, Globe, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: 'feed' | 'communities' | 'messages' | 'projects' | 'pro') => void;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeTab, 
  onSelectTab,
  className = '' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    userRole, 
    isProMember, 
    isAdmin, 
    unreadNotificationsCount, 
    joinedCommunityIds,
    setIsCreatePostOpen,
    setIsCheckoutOpen
  } = useAuth();

  const isCurrentPath = (path: string) => location.pathname === path;

  const handleTabSelect = (tab: 'feed' | 'communities' | 'messages' | 'projects' | 'pro') => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <aside className={`w-full lg:w-64 shrink-0 flex flex-col space-y-6 ${className}`}>
      {/* Navigation Groups */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Core Main Links */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Workspace
          </div>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => handleTabSelect('feed')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'feed' || (isCurrentPath('/dashboard') && !activeTab)
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Feed</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'feed' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('communities')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'communities'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Compass className="w-4 h-4 text-indigo-500" />
                <span>Explore Tribes</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full">
                8
              </span>
            </button>

            <Link
              to="/communities"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isCurrentPath('/communities')
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>My Communities</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full">
                {joinedCommunityIds.length}
              </span>
            </Link>

            <Link
              to="/messages"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isCurrentPath('/messages') || activeTab === 'messages'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Messages (Socket)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>

            <Link
              to="/projects"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isCurrentPath('/projects') || activeTab === 'projects'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <span>Project Match</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-full">
                New
              </span>
            </Link>
          </nav>
        </div>

        {/* Account & Settings Group */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account & Preferences
          </div>
          <nav className="space-y-1">
            <Link
              to="/onboarding"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isCurrentPath('/profile') || isCurrentPath('/onboarding')
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>Profile & Skills</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => onSelectTab ? onSelectTab('pro') : setIsCheckoutOpen(true)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pro'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                  : 'text-indigo-600 hover:bg-indigo-50 font-bold'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isProMember ? 'Pro Perks' : 'Upgrade to Pro'}</span>
              </div>
              <span className="text-[9px] uppercase px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold rounded-md">
                {isProMember ? 'Active' : '$19/mo'}
              </span>
            </button>

            <Link
              to="/billing"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isCurrentPath('/billing')
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span>Billing & Plan</span>
              </div>
            </Link>

            {/* Admin Console Navigation Item */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isCurrentPath('/admin')
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 bg-purple-100 text-purple-800 font-extrabold rounded-md">
                  Root
                </span>
              </Link>
            )}
          </nav>
        </div>

        {/* Quick Action Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsCreatePostOpen(true)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>

      </div>

      {/* User Micro Profile Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
            <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Status</span>
          <span className="font-bold text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
