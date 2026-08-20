import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Community } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CommunityContextType {
  communities: Community[];
  isLoading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  joinCommunity: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  createCommunity: (communityData: { name: string; description: string; category: string; tags: string[]; coverImage?: string | null; isProOnly?: boolean }) => Promise<any>;
  updateCommunity: (communityId: string, communityData: { name: string; description: string; category: string; tags: string[]; coverImage?: string | null; isProOnly?: boolean }) => Promise<any>;
  deleteCommunity: (communityId: string) => Promise<void>;
  fetchMembers: (communityId: string) => Promise<any[]>;
  isCommunityJoined: (communityId: string) => boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const getCategoryFromName = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('ai') || n.includes('data') || n.includes('machine learning')) return 'AI & Data';
  if (n.includes('design') || n.includes('ux') || n.includes('ui')) return 'Design';
  if (n.includes('nomad') || n.includes('lifestyle') || n.includes('travel')) return 'Lifestyle';
  if (n.includes('writer') || n.includes('docs') || n.includes('writing') || n.includes('content')) return 'Content & Docs';
  if (n.includes('founder') || n.includes('freelancer') || n.includes('startup') || n.includes('business')) return 'Business';
  return 'Engineering';
};

const getTagsFromName = (name: string): string[] => {
  const n = name.toLowerCase();
  if (n.includes('saas')) return ['Micro-SaaS', 'TypeScript', 'Stripe', 'Cloud'];
  if (n.includes('ai') || n.includes('engineers')) return ['PyTorch', 'LLMs', 'RAG', 'Vector DBs'];
  if (n.includes('design')) return ['Figma', 'Design Systems', 'UX Research', 'Micro-interactions'];
  if (n.includes('nomad')) return ['Remote Work', 'Coliving', 'Tax Expat', 'Travel'];
  if (n.includes('writer')) return ['Docs-as-Code', 'OpenAPI', 'Developer Relations', 'Markdown'];
  if (n.includes('freelancer')) return ['Client Work', 'Value Pricing', 'Contracts', 'Growth'];
  if (n.includes('founder')) return ['Bootstrapping', 'Fundraising', 'Growth', 'Hiring'];
  if (n.includes('remote')) return ['Async Work', 'Home Office', 'Burnout Prevention', 'Tools'];
  return ['Builders', 'Remote', 'Tech'];
};

const getIconFromName = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('saas') || n.includes('developer') || n.includes('engineering')) return 'Code2';
  if (n.includes('ai') || n.includes('machine')) return 'Cpu';
  if (n.includes('design') || n.includes('ux') || n.includes('ui')) return 'Palette';
  if (n.includes('nomad') || n.includes('travel')) return 'Globe';
  if (n.includes('writer') || n.includes('doc')) return 'BookOpen';
  if (n.includes('freelancer') || n.includes('client')) return 'Briefcase';
  if (n.includes('founder') || n.includes('startup')) return 'Rocket';
  if (n.includes('remote') || n.includes('worker')) return 'Shield';
  return 'Users';
};

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapCommunity = (c: any): Community => {
    const isJoined = Array.isArray(c.members) && c.members.some((m: any) => m.userId === user?.id);
    const isPro = c.visibility === 'private' || c.slug === 'ai-engineers' || c.slug === 'startup-founders';
    return {
      id: c.id,
      name: c.name,
      category: getCategoryFromName(c.name),
      description: c.description || 'A remote builder micro-tribe.',
      iconName: getIconFromName(c.name),
      memberCount: c.members ? `${c.members.length} Members` : '1 Member',
      activeNowCount: c.activeNowCount || 'Active Now',
      tags: getTagsFromName(c.name),
      isJoined: isJoined,
      isProOnly: isPro,
      featured: c.featured || false,
      coverImage: c.coverImage || undefined,
      rules: c.rules || [
        'Maintain constructive technical discussions.',
        'No unsolicited commercial cold-DM spam.',
        'Share code snippets with syntax highlighting.'
      ],
      activityLevel: 'Active',
      recentTopic: 'Welcome to the hub!',
      members: c.members ? String(c.members.length) : '1',
    };
  };

  const fetchCommunities = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; communities: any[] }>('/communities');
      if (response && response.communities) {
        setCommunities(response.communities.map(mapCommunity));
      }
    } catch (err: any) {
      setError(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const joinCommunity = async (communityId: string) => {
    try {
      await api.post(`/communities/${communityId}/join`);
      await fetchCommunities();
    } catch (err: any) {
      throw err;
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      await api.post(`/communities/${communityId}/leave`);
      await fetchCommunities();
    } catch (err: any) {
      throw err;
    }
  };

  const createCommunity = async (communityData: { name: string; description: string; category: string; tags: string[]; coverImage?: string | null; isProOnly?: boolean }) => {
    try {
      const payload = {
        name: communityData.name,
        description: communityData.description,
        visibility: communityData.isProOnly ? 'private' : 'public',
        coverImage: communityData.coverImage || null,
      };
      const response = await api.post<{ success: boolean; community: any }>('/communities', payload);
      await fetchCommunities();
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const updateCommunity = async (communityId: string, communityData: { name: string; description: string; category: string; tags: string[]; coverImage?: string | null; isProOnly?: boolean }) => {
    try {
      const payload = {
        name: communityData.name,
        description: communityData.description,
        visibility: communityData.isProOnly ? 'private' : 'public',
        coverImage: communityData.coverImage || null,
      };
      const response = await api.put<{ success: boolean; community: any }>(`/communities/${communityId}`, payload);
      await fetchCommunities();
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteCommunity = async (communityId: string) => {
    try {
      await api.delete(`/communities/${communityId}`);
      await fetchCommunities();
    } catch (err: any) {
      throw err;
    }
  };

  const fetchMembers = async (communityId: string) => {
    try {
      const response = await api.get<{ success: boolean; members: any[] }>(`/communities/${communityId}/members`);
      return response.members || [];
    } catch (err: any) {
      console.error('Failed to fetch community members', err);
      return [];
    }
  };

  const isCommunityJoined = (communityId: string) => {
    const comm = communities.find((c) => c.id === communityId);
    return comm ? !!comm.isJoined : false;
  };

  // Fetch communities initially when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchCommunities();
    } else {
      setCommunities([]);
    }
  }, [isAuthenticated]);

  return (
    <CommunityContext.Provider
      value={{
        communities,
        isLoading,
        error,
        fetchCommunities,
        joinCommunity,
        leaveCommunity,
        createCommunity,
        updateCommunity,
        deleteCommunity,
        fetchMembers,
        isCommunityJoined,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
