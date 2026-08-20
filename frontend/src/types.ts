export type UserRole = 'Guest' | 'FreeMember' | 'ProMember' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  role: string;
  userRole: UserRole;
  company: string;
  location: string;
  bio: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  portfolio: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  projectsCount: number;
  connectionsCount: number;
  stripeSubscriptionId?: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  parentId?: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    userRole: UserRole;
  };
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: CommentItem[];
}

export interface Post {
  id: string;
  communityId?: string;
  communityName?: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
    role: string;
    userRole?: UserRole;
  };
  timeAgo: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isProOnly?: boolean;
  commentList?: CommentItem[];
}

export interface Community {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  memberCount: string;
  activeNowCount: string;
  tags: string[];
  isJoined?: boolean;
  isProOnly?: boolean;
  featured?: boolean;
  featuredProject?: string;
  rules?: string[];
  activityLevel?: string;
  recentTopic?: string;
  members?: string;
  coverImage?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  type: string; // Remote, Hybrid, On-site
  salary: string;
  skills: string[];
  postedAgo: string;
  applicantsCount: string;
  isSaved?: boolean;
  isProOnly?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  lead: {
    name: string;
    avatar: string;
    role?: string;
  };
  members: {
    name: string;
    avatar: string;
  }[];
  skills: string[];
  progress: number;
  spotsOpen: number;
  isJoined?: boolean;
  isProOnly?: boolean;
  budget?: string;
  bannerImage?: string;
}

export interface Conversation {
  id: string;
  participantId?: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  participantStatus: 'online' | 'away' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isProOnly?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  sender: 'you' | 'professional' | 'community';
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: 'image' | 'file';
}

export interface AppNotification {
  id: string;
  type: 'message' | 'like' | 'comment' | 'match' | 'system' | 'pro';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface PlatformSettings {
  announcementBanner: {
    enabled: boolean;
    text: string;
    type: 'info' | 'warning' | 'success';
  };
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  proPriceMonthly: number;
}

