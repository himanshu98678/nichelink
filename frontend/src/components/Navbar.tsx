import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Network, Menu, X, ArrowRight, MessageSquare, Plus, Sparkles, ShieldCheck, Zap, LayoutDashboard, Compass, LogIn, Bell, Check, ExternalLink, Shield, LogOut, User, Camera, Clock3 } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    userRole,
    user,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsCreatePostOpen,
    setIsCreateCommunityOpen,
    setIsCheckoutOpen,
    setIsAvatarModalOpen,
    isAdmin,
    logout,
  } = useAuth();

  const isPublicNav = !isAuthenticated || location.pathname === '/' || location.pathname === '/about';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Platform Brand */}
          <div className="flex items-center space-x-4">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-600 transition-colors">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                NicheLink
              </span>
            </Link>
          </div>

          {/* ========================================================= */}
          {/* 1. PUBLIC LANDING PAGE NAVIGATION (Clean Presentation Mode) */}
          {/* ========================================================= */}
          {isPublicNav ? (
            <>
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
                <a
                  href="/#how-it-works"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="/#features"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Features
                </a>
                <Link
                  to="/pricing"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Pricing
                </Link>
                <a
                  href="/#faq"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  FAQ
                </a>
              </nav>

              {/* Desktop Right Auth CTAs: Sign In & Sign Up */}
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/signin"
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* 2. AUTHENTICATED APP / DASHBOARD NAVIGATION              */
            /* ========================================================= */
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <Link
                  to="/dashboard"
                  className={`text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/dashboard') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/communities"
                  className={`text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/communities') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Tribes</span>
                </Link>

                <Link
                  to="/messages"
                  className={`text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive('/messages') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Messages</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </Link>

                <Link
                  to="/projects"
                  className={`text-sm font-semibold transition-colors ${
                    isActive('/projects') || isActive('/matches') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Project Match
                </Link>

                <Link
                  to="/time-tracking"
                  className={`text-sm font-semibold transition-colors flex items-center space-x-1.5 ${isActive('/time-tracking') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>Timesheet</span>
                </Link>

                <Link
                  to="/community-chat"
                  className={`text-sm font-semibold transition-colors flex items-center space-x-1.5 ${isActive('/community-chat') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Community Chat</span>
                </Link>

                <Link
                  to="/pricing"
                  className={`text-sm font-semibold transition-colors ${
                    isActive('/pricing') ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pricing
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm font-bold transition-colors flex items-center space-x-1 px-2.5 py-1 rounded-lg ${
                      isActive('/admin') 
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-200' 
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
              </nav>

              {/* Desktop Right CTAs for App */}
              <div className="hidden md:flex items-center space-x-2.5">
                
                {/* Create Post Action */}
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Post</span>
                </button>

                {/* Notifications Center Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Notification Popover Drawer */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Notification Hub
                          </h4>
                          {unreadNotificationsCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">
                              {unreadNotificationsCount} new
                            </span>
                          )}
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) {
                                navigate(n.link);
                                setNotificationsOpen(false);
                              }
                            }}
                            className={`p-3 rounded-xl transition-colors cursor-pointer border ${
                              n.read
                                ? 'bg-white border-slate-100 hover:bg-slate-50'
                                : 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-bold text-xs text-slate-900">{n.title}</div>
                              <span className="text-[10px] text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Avatar & Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                      userRole === 'ProMember' ? 'bg-indigo-600 text-white border-indigo-500' :
                      userRole === 'Admin' ? 'bg-rose-600 text-white border-rose-500' :
                      userRole === 'FreeMember' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {userRole}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in space-y-1">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>My Dashboard</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsAvatarModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer text-left"
                      >
                        <Camera className="w-4 h-4 text-indigo-600" />
                        <span>Change Profile Photo</span>
                      </button>
                      <Link
                        to="/onboarding"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Edit Profile & Skills</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/', { replace: true });
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4 shadow-lg animate-fade-in">
          {isPublicNav ? (
            <div className="flex flex-col space-y-3 pt-2">
              <a
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                How It Works
              </a>
              <a
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                Features
              </a>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                Pricing
              </Link>
              <a
                href="/#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                FAQ
              </a>
              <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-slate-800 bg-slate-100 rounded-xl text-sm font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-white bg-slate-900 rounded-xl text-sm font-bold"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3 pt-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-semibold text-slate-900 hover:bg-slate-50 flex items-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Main Dashboard</span>
              </Link>
              <Link
                to="/communities"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-2"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Tribes & Communities</span>
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Direct Messages</span>
              </Link>
              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                Project Match
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                Pricing
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>Admin Console</span>
                </Link>
              )}
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
                <button
                  onClick={() => { setIsCreatePostOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  + Create Discussion Post
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};


