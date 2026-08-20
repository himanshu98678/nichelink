import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Post } from '../types';
import { api, resolveMediaUrl } from '../services/api';
import { useAuth } from './AuthContext';

interface PostContextType {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  fetchPosts: (filters?: { communityId?: string; authorId?: string }) => Promise<void>;
  addPost: (postData: { content: string; communityId?: string; tags: string[]; isProOnly?: boolean; images?: string[] }) => Promise<any>;
  editPost: (postId: string, content: string, tags?: string[], isProOnly?: boolean, images?: string[]) => Promise<any>;
  deletePost: (postId: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  incrementPostCommentCount: (postId: string, amount: number) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedRequestVersion = useRef(0);

  const mapPost = (p: any): Post => {
    const isLiked = Array.isArray(p.likes) && p.likes.length > 0;
    const isSaved = Array.isArray(p.saves) && p.saves.length > 0;

    let timeAgoText = 'Just now';
    if (p.createdAt) {
      const diffMs = Date.now() - new Date(p.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 0) timeAgoText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffHours > 0) timeAgoText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffMins > 0) timeAgoText = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }

    return {
      id: p.id,
      communityId: p.communityId || undefined,
      communityName: p.community ? p.community.name : undefined,
      author: {
        id: p.author.id,
        name: p.author.name,
        username: `@${p.author.username}`,
        avatar: p.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: p.author.role || 'Builder',
        userRole: p.author.userRole || 'FreeMember',
      },
      timeAgo: timeAgoText,
      content: p.content,
      imageUrl: p.images && p.images.length > 0 ? resolveMediaUrl(p.images[0]) : undefined,
      tags: p.tags && p.tags.length > 0 ? p.tags : ['Discussion'],
      likes: p.likeCount || 0,
      comments: p.commentCount || 0,
      shares: p.shareCount || 0,
      isLiked: isLiked,
      isSaved: isSaved,
      isProOnly: p.visibility === 'FOLLOWERS' || p.visibility === 'PRIVATE',
    };
  };

  const fetchPosts = async (filters?: { communityId?: string; authorId?: string }) => {
    const requestVersion = ++feedRequestVersion.current;
    setIsLoading(true);
    setError(null);
    try {
      const queryParams: any = {};
      if (filters?.communityId) queryParams.communityId = filters.communityId;
      if (filters?.authorId) queryParams.authorId = filters.authorId;

      const query = new URLSearchParams(queryParams).toString();
      const response = await api.get<{ success: boolean; posts: any[] }>(`/posts${query ? `?${query}` : ''}`);
      if (requestVersion === feedRequestVersion.current && response?.posts) {
        setPosts(response.posts.map(mapPost));
      }
    } catch (err: any) {
      if (requestVersion === feedRequestVersion.current) {
        setError(api.getFriendlyMessage(err));
      }
    } finally {
      if (requestVersion === feedRequestVersion.current) {
        setIsLoading(false);
      }
    }
  };

  const addPost = async (postData: { content: string; communityId?: string; tags: string[]; isProOnly?: boolean; images?: string[] }) => {
    try {
      const payload = {
        content: postData.content,
        communityId: postData.communityId || null,
        visibility: postData.isProOnly ? 'FOLLOWERS' : 'PUBLIC',
        images: postData.images || [],
        tags: postData.tags || []
      };
      const response = await api.post<{ success: boolean; post: any }>('/posts', payload);

      if (!response?.post?.id) {
        throw new Error('Post creation succeeded without a persisted post response.');
      }

      const mappedPost = mapPost(response.post);
      feedRequestVersion.current += 1;
      setPosts((previous) => [mappedPost, ...previous.filter((post) => post.id !== mappedPost.id)]);
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const editPost = async (postId: string, content: string, tags?: string[], isProOnly?: boolean, images?: string[]) => {
    try {
      const payload = {
        content,
        visibility: isProOnly ? 'FOLLOWERS' : 'PUBLIC',
        images: images || [],
        tags: tags || []
      };
      const response = await api.patch<{ success: boolean; post: any }>(`/posts/${postId}`, payload);
      if (response?.post) {
        const mappedPost = mapPost(response.post);
        setPosts((previous) => previous.map((post) => post.id === mappedPost.id ? mappedPost : post));
      }
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((previous) => previous.filter((post) => post.id !== postId));
    } catch (err: any) {
      throw err;
    }
  };

  const toggleLikePost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      
      // Toggle locally to feel instantaneous, then sync feed in background
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const nextLiked = !p.isLiked;
            return {
              ...p,
              isLiked: nextLiked,
              likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Failed to toggle post like', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.isSaved) {
        await api.delete(`/posts/${postId}/save`);
      } else {
        await api.post(`/posts/${postId}/save`);
      }
      
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isSaved: !p.isSaved
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Failed to toggle post save', err);
    }
  };

  const incrementPostCommentCount = (postId: string, amount: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: Math.max(0, p.comments + amount) };
        }
        return p;
      })
    );
  };

  // Fetch posts initially when user authenticates
  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]);

  return (
    <PostContext.Provider
      value={{
        posts,
        isLoading,
        error,
        fetchPosts,
        addPost,
        editPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        incrementPostCommentCount,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};
