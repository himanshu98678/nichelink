import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, UserProfile, Post, CommentItem, Community, AppNotification, PlatformSettings } from '../types';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { currentUserProfile, samplePosts } from '../data/mockData';
import { COMMUNITIES_DATA } from '../data/communities';

interface AuthContextType {
  // Authentication & User State
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userRole: UserRole;
  user: UserProfile;
  onboardingCompleted: boolean;
  login: (email: string, password?: string) => Promise<any>;
  register: (userData: { name: string; email: string; password?: string; role?: string; primaryCommunity?: string }) => Promise<any>;
  completePendingVerification: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    name?: string;
    role?: string;
    bio?: string;
    avatar?: string;
    skills?: string[];
    joinedCommunities?: string[];
  }) => Promise<any>;
  setUserRole: (role: UserRole) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<any>;

  // Communities State & Admin Operations
  communities: Community[];
  joinedCommunityIds: string[];
  toggleJoinCommunity: (communityId: string) => void;
  isCommunityJoined: (communityId: string) => boolean;
  addCommunity: (communityData: Partial<Community>) => void;
  editCommunity: (communityId: string, updates: Partial<Community>) => void;
  deleteCommunity: (communityId: string) => void;

  // Posts, Comments & Reactions State
  posts: Post[];
  addPost: (newPostData: {
    content: string;
    communityId: string;
    tags: string[];
    imageUrl?: string;
    isProOnly?: boolean;
  }) => void;
  editPost: (postId: string, content: string, tags?: string[], isProOnly?: boolean) => void;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string | null) => void;
  likeComment: (postId: string, commentId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'time'>) => void;

  // Admin User Moderation
  allUsers: UserProfile[];
  updateUserRole: (userId: string, newRole: UserRole) => void;
  deleteUser: (userId: string) => void;
  
  // Platform Controls
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;

  // Modals & Monetization
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (open: boolean) => void;
  isCreateCommunityOpen: boolean;
  setIsCreateCommunityOpen: (open: boolean) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;

  // RBAC Permission Helpers
  isGuest: boolean;
  isFreeMember: boolean;
  isProMember: boolean;
  isAdmin: boolean;
  canCreatePost: boolean;
  canCreateCommunity: boolean;
  canPostProjectMatch: boolean;
  canAccessProHubs: boolean;
  canSendDirectMessage: boolean;
  pendingVerificationEmail: string;
  setPendingVerificationEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_COMMENTS_MAP: Record<string, CommentItem[]> = {
  post_1: [
    {
      id: 'c1',
      postId: 'post_1',
      author: {
        id: 'usr_2',
        name: 'David Kim',
        username: '@davidkim_ai',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        userRole: 'ProMember',
      },
      text: 'Sub-100ms latency on hybrid RAG is huge! What distance metric did you settle on for the dense vector indexing?',
      timestamp: '1 hour ago',
      likes: 8,
      isLiked: false,
      replies: [
        {
          id: 'c1_1',
          postId: 'post_1',
          parentId: 'c1',
          author: {
            id: 'usr_sarah',
            name: 'Sarah Chen',
            username: '@sarahchen_ai',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
            userRole: 'ProMember',
          },
          text: 'We found Cosine Similarity with HNSW graph indexing gave the best recall balance at 1536 dimensions! 💡',
          timestamp: '35 mins ago',
          likes: 4,
          isLiked: true,
        },
      ],
    },
  ],
  post_2: [
    {
      id: 'c2',
      postId: 'post_2',
      author: {
        id: 'usr_elena',
        name: 'Elena Rostova',
        username: '@elena_dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        userRole: 'FreeMember',
      },
      text: 'The token naming convention in the kit is super clean. Already using it in our remote project!',
      timestamp: '3 hours ago',
      likes: 5,
      isLiked: false,
    },
  ],
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'message',
    title: 'New Socket.io DM',
    description: 'David Kim sent you a message about the hybrid RAG pipeline.',
    time: '5m ago',
    read: false,
    link: '/messages',
  },
  {
    id: 'n2',
    type: 'like',
    title: 'Post Upvoted',
    description: 'Elena Rostova and 4 others liked your post in #SaaS Developers.',
    time: '25m ago',
    read: false,
    link: '/dashboard',
  },
  {
    id: 'n3',
    type: 'match',
    title: 'New Project Application',
    description: 'Sarah Chen applied to collaborate on "Distributed Vector DB for Edge Devices".',
    time: '2h ago',
    read: true,
    link: '/projects',
  },
  {
    id: 'n4',
    type: 'pro',
    title: 'NicheLink Pro Active',
    description: 'Your Pro subscription is active with unlocked access to all micro-tribes.',
    time: '1d ago',
    read: true,
    link: '/pricing',
  },
];

const INITIAL_ALL_USERS: UserProfile[] = [
  {
    ...currentUserProfile,
    id: 'usr_admin',
    name: 'Alex Vance',
    username: '@alex_vance',
    email: 'alex@nichelink.io',
    userRole: 'ProMember',
  },
  {
    id: 'usr_2',
    name: 'David Kim',
    username: '@davidkim_ai',
    email: 'david.kim@edgevector.ai',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Staff AI Architect',
    userRole: 'ProMember',
    company: 'EdgeVector Labs',
    location: 'Seoul (Remote)',
    bio: 'Pioneering local embeddings, quantization and async agentic systems.',
    skills: ['PyTorch', 'Rust', 'CUDA', 'Vector Search'],
    experience: [],
    education: [],
    portfolio: [],
    socialLinks: {},
    projectsCount: 4,
    connectionsCount: 320,
  },
  {
    id: 'usr_3',
    name: 'Sarah Chen',
    username: '@sarahchen_ai',
    email: 'sarah@tensorops.dev',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'PyTorch Core Contributor',
    userRole: 'ProMember',
    company: 'TensorOps',
    location: 'San Francisco, CA',
    bio: 'Distributed machine learning, memory reduction, low-precision GEMM kernels.',
    skills: ['Python', 'Deep Learning', 'PyTorch', 'Distributed Training'],
    experience: [],
    education: [],
    portfolio: [],
    socialLinks: {},
    projectsCount: 6,
    connectionsCount: 450,
  },
  {
    id: 'usr_4',
    name: 'Elena Rostova',
    username: '@elena_dev',
    email: 'elena@berlintech.de',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Full Stack Engineer',
    userRole: 'FreeMember',
    company: 'NextStack DE',
    location: 'Berlin, Germany',
    bio: 'TypeScript, GraphQL, Next.js, and serverless Postgres enthusiast.',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    experience: [],
    education: [],
    portfolio: [],
    socialLinks: {},
    projectsCount: 2,
    connectionsCount: 180,
  },
  {
    id: 'usr_5',
    name: 'Marcus Vance',
    username: '@marcus_design',
    email: 'marcus@craftui.design',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Principal Design Engineer',
    userRole: 'ProMember',
    company: 'Craft Studio',
    location: 'London, UK',
    bio: 'Bridging design tokens, micro-interactions, and accessibility.',
    skills: ['Figma', 'Design Systems', 'Tailwind CSS', 'Framer Motion'],
    experience: [],
    education: [],
    portfolio: [],
    socialLinks: {},
    projectsCount: 5,
    connectionsCount: 290,
  },
];

const mapBackendNotification = (notification: any): AppNotification => {
  const normalizedType = String(notification.type || 'SYSTEM').toLowerCase();
  const type: AppNotification['type'] = ['message', 'like', 'comment', 'match', 'system', 'pro'].includes(normalizedType)
    ? normalizedType as AppNotification['type']
    : 'system';

  return {
    id: notification.id,
    type,
    title: notification.title || 'NicheLink notification',
    description: notification.message || '',
    time: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '',
    read: Boolean(notification.isRead),
    link: notification.referenceType === 'MESSAGE' ? '/messages' : undefined,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [pendingVerificationEmail, setPendingVerificationEmailState] = useState<string>(() => {
    return localStorage.getItem('nichelink_pending_email') || '';
  });
  const [pendingVerificationSession, setPendingVerificationSession] = useState<{ token: string; refreshToken: string; user: any } | null>(null);

  const setPendingVerificationEmail = (email: string) => {
    setPendingVerificationEmailState(email);
    localStorage.setItem('nichelink_pending_email', email);
  };

  // Load initial authentication & state from localStorage if available (default to false if not present)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('nichelink_auth');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    const saved = localStorage.getItem('nichelink_onboarding');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('nichelink_role');
    const savedAuth = localStorage.getItem('nichelink_auth');
    const isAuthed = savedAuth !== null ? JSON.parse(savedAuth) : false;
    if (!isAuthed) return 'Guest';
    return (savedRole as UserRole) || 'FreeMember';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nichelink_user');
    return saved ? JSON.parse(saved) : { ...currentUserProfile, userRole: 'FreeMember' };
  });

  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('nichelink_communities');
    return saved ? JSON.parse(saved) : COMMUNITIES_DATA;
  });

  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nichelink_joined_tribes');
    return saved ? JSON.parse(saved) : ['saas-developers', 'ai-engineers'];
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    return samplePosts.map((p) => ({
      ...p,
      commentList: INITIAL_COMMENTS_MAP[p.id] || [],
    }));
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('nichelink_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [socketNotificationCount, setSocketNotificationCount] = useState<number | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_ALL_USERS);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    announcementBanner: {
      enabled: true,
      text: '🚀 Welcome to NicheLink: The verified remote micro-community platform with real-time socket chats & co-founder matching.',
      type: 'info',
    },
    maintenanceMode: false,
    allowNewRegistrations: true,
    proPriceMonthly: 19,
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Helper to clear all local auth states on logout or auth failure
  const clearAuthStates = () => {
    localStorage.removeItem('nichelink_token');
    localStorage.removeItem('nichelink_refresh_token');
    localStorage.setItem('nichelink_auth', 'false');
    localStorage.setItem('nichelink_role', 'Guest');
    localStorage.removeItem('nichelink_pending_email');
    
    setIsAuthenticated(false);
    setUserRoleState('Guest');
    setUser({ ...currentUserProfile, userRole: 'Guest' });
  };

  // Register session failure callback from API client
  useEffect(() => {
    api.onAuthFailure(() => {
      clearAuthStates();
    });
  }, []);

  // Keep one authenticated socket session for the current user.
  useEffect(() => {
    if (!isAuthenticated || !user.id || user.userRole === 'Guest') {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(user.id);
    if (!socket) return undefined;

    const onSocketError = (error: Error) => {
      if (/authentication token|invalid authentication/i.test(error?.message || '')) {
        disconnectSocket();
        clearAuthStates();
      }
    };

    const onNotification = (notification: any) => {
      if (!notification?.id) return;
      setSocketNotificationCount(null);
      setNotifications((previous) => {
        if (previous.some((item) => item.id === notification.id)) return previous;
        return [{
          id: notification.id,
          type: notification.type === 'MESSAGE' ? 'message' : notification.type?.toLowerCase() || 'system',
          title: notification.title || 'New notification',
          description: notification.message || '',
          time: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now',
          read: Boolean(notification.isRead),
          link: notification.type === 'MESSAGE' ? '/messages' : undefined,
        }, ...previous];
      });
    };
    const onNotificationCount = (payload: any) => {
      if (typeof payload?.unreadCount === 'number') setSocketNotificationCount(payload.unreadCount);
    };
    const onNotificationRead = (payload: any) => {
      const ids = new Set<string>(payload?.notificationIds || []);
      if (payload?.all) {
        setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
      } else {
        setNotifications((previous) => previous.map((item) => ids.has(item.id) ? { ...item, read: true } : item));
      }
    };
    const onNotificationDeleted = (payload: any) => {
      if (payload?.all) {
        setNotifications([]);
      } else {
        const ids = new Set<string>(payload?.notificationIds || []);
        setNotifications((previous) => previous.filter((item) => !ids.has(item.id)));
      }
    };

    socket.on('notification:new', onNotification);
    socket.on('notification:count', onNotificationCount);
    socket.on('notification:read', onNotificationRead);
    socket.on('notification:deleted', onNotificationDeleted);
    socket.on('connect_error', onSocketError);
    return () => {
      socket.off('notification:new', onNotification);
      socket.off('notification:count', onNotificationCount);
      socket.off('notification:read', onNotificationRead);
      socket.off('notification:deleted', onNotificationDeleted);
      socket.off('connect_error', onSocketError);
      disconnectSocket();
    };
  }, [isAuthenticated, user.id, user.userRole]);

  // Initialize auth state check on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('nichelink_token');
      const savedAuth = localStorage.getItem('nichelink_auth');
      const isAuthed = savedAuth !== null ? JSON.parse(savedAuth) : false;

      if (token && isAuthed) {
        try {
          const response = await api.get<{ success: boolean; user: any }>('/auth/me');
          if (response && response.user) {
            let userRole: UserRole = 'FreeMember';
            if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
              userRole = 'Admin';
            } else if (
              response.user.isPro ||
              response.user.subscription?.planCode === 'PRO' ||
              response.user.stripeSubscriptionId ||
              response.user.role === 'PRO'
            ) {
              userRole = 'ProMember';
            } else {
              userRole = 'FreeMember';
            }

            const verifiedUser: UserProfile = {
              ...currentUserProfile,
              id: response.user.id,
              name: response.user.name,
              username: `@${response.user.username}`,
              email: response.user.email,
              role: response.user.role || 'Remote Builder',
              userRole: userRole,
              avatar: response.user.avatar || currentUserProfile.avatar,
              bio: response.user.bio || '',
            };

            setUser(verifiedUser);
            setIsAuthenticated(true);
            setUserRoleState(userRole);
            localStorage.setItem('nichelink_role', userRole);
            localStorage.setItem('nichelink_user', JSON.stringify(verifiedUser));
          } else {
            throw new Error('Invalid user payload');
          }
        } catch (err) {
          console.warn('Session validation failed on mount:', err);
          clearAuthStates();
        }
      } else {
        clearAuthStates();
      }
      setIsAuthLoading(false);
    };

    validateSession();
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (!isAuthLoading) {
      localStorage.setItem('nichelink_auth', JSON.stringify(isAuthenticated));
      localStorage.setItem('nichelink_onboarding', JSON.stringify(onboardingCompleted));
      localStorage.setItem('nichelink_role', userRole);
      localStorage.setItem('nichelink_user', JSON.stringify(user));
      localStorage.setItem('nichelink_joined_tribes', JSON.stringify(joinedCommunityIds));
      localStorage.setItem('nichelink_communities', JSON.stringify(communities));
      localStorage.setItem('nichelink_notifications', JSON.stringify(notifications));
    }
  }, [isAuthenticated, onboardingCompleted, userRole, user, joinedCommunityIds, communities, notifications, isAuthLoading]);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;

    const loadNotifications = async () => {
      try {
        const response = await api.get<{ success: boolean; items?: any[] }>('/notifications?limit=50');
        setNotifications((response.items || []).map(mapBackendNotification));
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      }
    };

    loadNotifications();
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading || userRole !== 'Admin') return;

    const loadAdminUsers = async () => {
      try {
        const response = await api.get<{ success: boolean; items?: any[]; users?: any[] }>('/admin/users?limit=100');
        const backendUsers = response.users || response.items || [];
        setAllUsers(backendUsers.map((backendUser: any) => ({
          ...currentUserProfile,
          id: backendUser.id,
          name: backendUser.name,
          username: `@${backendUser.username}`,
          email: backendUser.email,
          role: backendUser.role || 'Remote Builder',
          userRole: backendUser.role === 'ADMIN' || backendUser.role === 'SUPER_ADMIN' ? 'Admin' : 'FreeMember',
          avatar: backendUser.avatar || currentUserProfile.avatar,
          bio: backendUser.bio || '',
          skills: backendUser.skills || [],
        })));
      } catch (err) {
        console.warn('Failed to load admin users:', err);
      }
    };

    loadAdminUsers();
  }, [isAuthenticated, isAuthLoading, userRole]);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    setUser((prev) => ({
      ...prev,
      userRole: role,
    }));
  };

  const login = async (emailStr: string, passwordStr?: string) => {
    const response = await api.post<{ success: boolean; token: string; refreshToken: string; user: any }>('/auth/login', {
      email: emailStr,
      password: passwordStr || 'TemporaryPassword123!',
    });

    if (response && response.user) {
      if (!response.user.isVerified) {
        setPendingVerificationEmail(emailStr);
        setPendingVerificationSession({ token: response.token, refreshToken: response.refreshToken, user: response.user });
        throw new Error('Please verify your email before logging in.');
      }

      // Map backend role to UserRole: USER -> FreeMember or ProMember, ADMIN -> Admin
      let userRole: UserRole = 'FreeMember';
      if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
        userRole = 'Admin';
      } else if (
        response.user.isPro ||
        response.user.subscription?.planCode === 'PRO' ||
        response.user.stripeSubscriptionId ||
        response.user.role === 'PRO'
      ) {
        userRole = 'ProMember';
      } else {
        userRole = 'FreeMember';
      }

      // Save tokens
      localStorage.setItem('nichelink_token', response.token);
      localStorage.setItem('nichelink_refresh_token', response.refreshToken);
      
      setIsAuthenticated(true);
      setUserRoleState(userRole);
      
      const loggedInUser: UserProfile = {
        ...currentUserProfile,
        id: response.user.id,
        name: response.user.name,
        username: `@${response.user.username}`,
        email: response.user.email,
        role: response.user.role || 'Remote Builder',
        userRole: userRole,
        avatar: response.user.avatar || currentUserProfile.avatar,
        bio: response.user.bio || '',
      };
      
      setUser(loggedInUser);
      localStorage.setItem('nichelink_auth', JSON.stringify(true));
      localStorage.setItem('nichelink_onboarding', JSON.stringify(true));
      localStorage.setItem('nichelink_role', userRole);
      localStorage.setItem('nichelink_user', JSON.stringify(loggedInUser));
    }

    return response;
  };

  const register = async (userData: { name: string; email: string; password?: string; role?: string; primaryCommunity?: string }) => {
    // 1. Derive username: name lowercase, alphanumeric, 3-24 characters.
    const derivedName = userData.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const username = derivedName.length >= 3 
      ? derivedName.slice(0, 20) 
      : `user_${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Call backend register API
    const response = await api.post<{ success: boolean; user: any; token: string; refreshToken: string }>('/auth/register', {
      name: userData.name,
      username,
      email: userData.email,
      password: userData.password || 'TemporaryPassword123!',
    });

    // 3. Call backend email OTP endpoint to send verification email (type: "VERIFY")
    let otpSent = true;
    try {
      await api.post('/email/otp', {
        email: userData.email,
        type: 'VERIFY',
      });
    } catch (otpErr) {
      otpSent = false;
      console.warn('Initial OTP request failed. User registration succeeded. User can resend OTP on the next screen.', otpErr);
    }

    // 4. Update state (store the email and the registered user info temporarily in context, but do NOT set isAuthenticated = true yet)
    setPendingVerificationEmail(userData.email);
    setPendingVerificationSession({ token: response.token, refreshToken: response.refreshToken, user: response.user });

    // Save temporary user info in localStorage for fallback (optional but keeps UI data consistency)
    const newUser: UserProfile = {
      ...currentUserProfile,
      id: response.user?.id || `usr_${Date.now()}`,
      name: userData.name || 'New Member',
      username: `@${username}`,
      email: userData.email,
      role: userData.role || 'Remote Builder',
      userRole: 'FreeMember',
    };
    setUser(newUser);
    setAllUsers((prev) => [newUser, ...prev]);

    return { ...response, otpSent };
  };

  const completePendingVerification = async () => {
    if (!pendingVerificationSession) {
      throw new Error('Your signup session has expired. Please sign in again.');
    }

    const { token, refreshToken, user: verifiedUser } = pendingVerificationSession;
    let userRole: UserRole = 'FreeMember';
    if (verifiedUser.role === 'ADMIN' || verifiedUser.role === 'SUPER_ADMIN') {
      userRole = 'Admin';
    } else {
      userRole = verifiedUser.stripeSubscriptionId ? 'ProMember' : 'FreeMember';
    }

    localStorage.setItem('nichelink_token', token);
    localStorage.setItem('nichelink_refresh_token', refreshToken);
    setIsAuthenticated(true);
    setUserRoleState(userRole);

    const authenticatedUser: UserProfile = {
      ...currentUserProfile,
      id: verifiedUser.id,
      name: verifiedUser.name,
      username: `@${verifiedUser.username}`,
      email: verifiedUser.email,
      role: verifiedUser.role || 'Remote Builder',
      userRole,
      avatar: verifiedUser.avatar || currentUserProfile.avatar,
      bio: verifiedUser.bio || '',
    };
    setUser(authenticatedUser);
    localStorage.setItem('nichelink_auth', JSON.stringify(true));
    localStorage.setItem('nichelink_onboarding', JSON.stringify(true));
    localStorage.setItem('nichelink_role', userRole);
    localStorage.setItem('nichelink_user', JSON.stringify(authenticatedUser));
    setPendingVerificationSession(null);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('nichelink_refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { token: refreshToken });
      } catch (err) {
        console.warn('Backend logout failed:', err);
      }
    }
    clearAuthStates();
  };

  const completeOnboarding = async (data: {
    name?: string;
    role?: string;
    bio?: string;
    avatar?: string;
    skills?: string[];
    joinedCommunities?: string[];
  }) => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.avatar !== undefined) payload.avatar = data.avatar;
    if (data.skills !== undefined) payload.skills = data.skills;

    let updatedUser = { ...user };

    if (Object.keys(payload).length > 0) {
      const response = await api.put<{ success: boolean; user: any }>('/auth/profile', payload);
      if (response && response.user) {
        updatedUser = {
          ...user,
          name: response.user.name || user.name,
          bio: response.user.bio || user.bio,
          avatar: response.user.avatar || user.avatar,
          skills: response.user.skills || user.skills,
        };
      }
    }

    if (data.role) {
      updatedUser.role = data.role;
    }

    setUser(updatedUser);
    localStorage.setItem('nichelink_user', JSON.stringify(updatedUser));

    if (data.joinedCommunities && data.joinedCommunities.length > 0) {
      setJoinedCommunityIds(data.joinedCommunities);
    }
    
    setOnboardingCompleted(true);
    localStorage.setItem('nichelink_onboarding', JSON.stringify(true));
  };

  const updateProfile = async (profileUpdate: Partial<UserProfile>) => {
    const payload: any = {};
    if (profileUpdate.name !== undefined) payload.name = profileUpdate.name;
    if (profileUpdate.bio !== undefined) payload.bio = profileUpdate.bio;
    if (profileUpdate.avatar !== undefined) payload.avatar = profileUpdate.avatar;
    if (profileUpdate.skills !== undefined) payload.skills = profileUpdate.skills;

    if (Object.keys(payload).length > 0) {
      const response = await api.put<{ success: boolean; user: any }>('/auth/profile', payload);
      if (response && response.user) {
        setUser((prev) => {
          const updated = {
            ...prev,
            name: response.user.name || prev.name,
            bio: response.user.bio || prev.bio,
            avatar: response.user.avatar || prev.avatar,
            skills: response.user.skills || prev.skills,
          };
          localStorage.setItem('nichelink_user', JSON.stringify(updated));
          return updated;
        });
        return response;
      }
    }
  };

  const toggleJoinCommunity = (communityId: string) => {
    setJoinedCommunityIds((prev) =>
      prev.includes(communityId) ? prev.filter((id) => id !== communityId) : [...prev, communityId]
    );
  };

  const isCommunityJoined = (communityId: string) => {
    return joinedCommunityIds.includes(communityId);
  };

  // Community Management for Admin
  const addCommunity = (communityData: Partial<Community>) => {
    const newCommunity: Community = {
      id: communityData.id || `comm_${Date.now()}`,
      name: communityData.name || 'New Tribe',
      category: communityData.category || 'Engineering',
      description: communityData.description || 'A high signal remote micro-community.',
      iconName: communityData.iconName || 'Code2',
      memberCount: '1 Member',
      activeNowCount: '1 Active',
      tags: communityData.tags || ['Remote', 'Discussion'],
      isProOnly: communityData.isProOnly || false,
      featured: communityData.featured || false,
      members: '1 verified builders',
      activityLevel: 'High',
    };
    setCommunities((prev) => [newCommunity, ...prev]);
  };

  const editCommunity = (communityId: string, updates: Partial<Community>) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, ...updates } : c))
    );
  };

  const deleteCommunity = (communityId: string) => {
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    setJoinedCommunityIds((prev) => prev.filter((id) => id !== communityId));
  };

  // Post Operations
  const addPost = (newPostData: {
    content: string;
    communityId: string;
    tags: string[];
    imageUrl?: string;
    isProOnly?: boolean;
  }) => {
    const community = communities.find((c) => c.id === newPostData.communityId);
    const newPost: Post = {
      id: `post_${Date.now()}`,
      communityId: newPostData.communityId,
      communityName: community ? community.name : 'Remote Hub',
      author: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        userRole: user.userRole,
      },
      timeAgo: 'Just now',
      content: newPostData.content,
      tags: newPostData.tags.length > 0 ? newPostData.tags : ['Discussion'],
      imageUrl: newPostData.imageUrl,
      likes: 1,
      comments: 0,
      shares: 0,
      isLiked: true,
      isSaved: false,
      isProOnly: newPostData.isProOnly || false,
      commentList: [],
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const editPost = (postId: string, content: string, tags?: string[], isProOnly?: boolean) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            content,
            tags: tags || p.tags,
            isProOnly: isProOnly !== undefined ? isProOnly : p.isProOnly,
          };
        }
        return p;
      })
    );
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
  };

  const toggleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isSaved: !p.isSaved,
          };
        }
        return p;
      })
    );
  };

  const addComment = (postId: string, text: string, parentId?: string | null) => {
    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      postId,
      parentId: parentId || null,
      author: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        userRole: user.userRole,
      },
      text,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentComments = p.commentList || [];

        if (!parentId) {
          return {
            ...p,
            comments: p.comments + 1,
            commentList: [newComment, ...currentComments],
          };
        }

        // Add to nested replies
        const updatedList = currentComments.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        });

        return {
          ...p,
          comments: p.comments + 1,
          commentList: updatedList,
        };
      })
    );
  };

  const likeComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const updatedList = (p.commentList || []).map((c) => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
            };
          }
          if (c.replies && c.replies.length > 0) {
            const updatedReplies = c.replies.map((reply) => {
              if (reply.id === commentId) {
                const isLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked,
                  likes: isLiked ? reply.likes + 1 : Math.max(0, reply.likes - 1),
                };
              }
              return reply;
            });
            return { ...c, replies: updatedReplies };
          }
          return c;
        });

        return {
          ...p,
          commentList: updatedList,
        };
      })
    );
  };

  const deleteComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const filterOut = (list: CommentItem[]): CommentItem[] =>
          list
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies ? filterOut(c.replies) : [],
            }));

        const updated = filterOut(p.commentList || []);
        return {
          ...p,
          comments: Math.max(0, p.comments - 1),
          commentList: updated,
        };
      })
    );
  };

  // Notification methods
  const unreadNotificationsCount = socketNotificationCount ?? notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = async (id: string) => {
    setSocketNotificationCount(null);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setSocketNotificationCount(null);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.warn('Failed to mark notifications as read:', err);
    }
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'time'>) => {
    setSocketNotificationCount(null);
    const newN: AppNotification = {
      ...notif,
      id: `n_${Date.now()}`,
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newN, ...prev]);
  };

  // Admin User operations
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const backendRole = newRole === 'Admin' ? 'ADMIN' : 'USER';
    try {
      const response = await api.post<{ success: boolean; user: any }>('/roles/assign', {
        userId,
        role: backendRole,
      });
      const updatedUser = response.user;
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? {
        ...u,
        userRole: newRole,
        role: updatedUser?.role || u.role,
      } : u)));
      if (user.id === userId) setUserRole(newRole);
    } catch (err) {
      console.warn('Failed to update user role:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.warn('Failed to delete user:', err);
    }
  };

  const updatePlatformSettings = (settings: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => ({ ...prev, ...settings }));
  };

  const isGuest = userRole === 'Guest';
  const isFreeMember = userRole === 'FreeMember';
  const isProMember = userRole === 'ProMember';
  const isAdmin = userRole === 'Admin';

  const canCreatePost = userRole === 'FreeMember' || userRole === 'ProMember' || userRole === 'Admin';
  const canCreateCommunity = userRole === 'Admin';
  const canPostProjectMatch = userRole === 'ProMember' || userRole === 'Admin';
  const canAccessProHubs = userRole === 'ProMember' || userRole === 'Admin';
  const canSendDirectMessage = userRole === 'FreeMember' || userRole === 'ProMember' || userRole === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        userRole,
        user,
        onboardingCompleted,
        login,
        register,
        completePendingVerification,
        logout,
        completeOnboarding,
        setUserRole,
        updateProfile,
        communities,
        joinedCommunityIds,
        toggleJoinCommunity,
        isCommunityJoined,
        addCommunity,
        editCommunity,
        deleteCommunity,
        posts,
        addPost,
        editPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        addComment,
        likeComment,
        deleteComment,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        allUsers,
        updateUserRole,
        deleteUser,
        platformSettings,
        updatePlatformSettings,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateCommunityOpen,
        setIsCreateCommunityOpen,
        isAvatarModalOpen,
        setIsAvatarModalOpen,
        isGuest,
        isFreeMember,
        isProMember,
        isAdmin,
        canCreatePost,
        canCreateCommunity,
        canPostProjectMatch,
        canAccessProHubs,
        canSendDirectMessage,
        pendingVerificationEmail,
        setPendingVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

