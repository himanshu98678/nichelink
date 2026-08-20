import React, { useState } from 'react';
import { samplePosts } from '../data/mockData';
import { 
  Heart, MessageSquare, Share2, Bookmark, ShieldCheck, 
  Send, Sparkles, Image, Code, FileText, Check, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NestedComments } from './NestedComments';
import { CommentItem, Post } from '../types';

interface FeedPreviewProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const FeedPreview: React.FC<FeedPreviewProps> = ({ onOpenAuth }) => {
  const { user, userRole, setIsCreatePostOpen, setIsCheckoutOpen, isGuest } = useAuth();

  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [likes, setLikes] = useState<Record<string, number>>({ post_1: 128, post_2: 94 });
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({ post_2: true });
  const [isSaved, setIsSaved] = useState<Record<string, boolean>>({ post_2: true });
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({ post_1: true });

  const [postComments, setPostComments] = useState<Record<string, CommentItem[]>>({
    post_1: [
      {
        id: 'c1',
        postId: 'post_1',
        author: {
          id: 'usr_2',
          name: 'Alex Rivera',
          username: '@alexrivera',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          userRole: 'ProMember',
        },
        text: 'Amazing optimization! Did you observe any memory overhead during high concurrency benchmark runs?',
        timestamp: '1 hour ago',
        likes: 12,
        isLiked: true,
        replies: [
          {
            id: 'c2',
            postId: 'post_1',
            parentId: 'c1',
            author: {
              id: 'usr_3',
              name: 'Sarah Chen',
              username: '@sarahchen_ai',
              avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
              userRole: 'ProMember',
            },
            text: '@Alex Rivera We used connection pooling & Rust bindings for token parsing, resulting in zero memory degradation!',
            timestamp: '45 mins ago',
            likes: 8,
            isLiked: false,
          },
        ],
      },
    ],
  });

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

  const handleSave = (postId: string) => {
    setIsSaved((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleComments = (postId: string) => {
    setCommentsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = (postId: string, text: string, parentId?: string | null) => {
    const newCommentObj: CommentItem = {
      id: `c_${Date.now()}`,
      postId,
      parentId,
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
      replies: [],
    };

    setPostComments((prev) => {
      const existing = prev[postId] || [];
      if (!parentId) {
        return { ...prev, [postId]: [newCommentObj, ...existing] };
      } else {
        // Find parent and attach nested reply
        const updateNested = (list: CommentItem[]): CommentItem[] => {
          return list.map((item) => {
            if (item.id === parentId) {
              return { ...item, replies: [...(item.replies || []), newCommentObj] };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: updateNested(item.replies) };
            }
            return item;
          });
        };
        return { ...prev, [postId]: updateNested(existing) };
      }
    });
  };

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Phase 2: Discussion Boards & Nested Threads</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            High-Signal Discussions & Nested Comments
          </h2>
          <p className="text-base text-slate-600">
            CRUD post management with rich formatting, image attachments, and nested threaded comments guarded by RBAC permissions.
          </p>
        </div>

        {/* Feed Container */}
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Post Creation Prompt */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
              />
              <input
                type="text"
                readOnly
                onClick={() => setIsCreatePostOpen(true)}
                placeholder={`Posting as ${user.name} (${userRole}). Click to open Rich Post Editor...`}
                className="w-full bg-slate-100/90 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 cursor-pointer focus:outline-none transition-colors font-medium"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <div className="flex items-center space-x-4">
                <button onClick={() => setIsCreatePostOpen(true)} className="flex items-center space-x-1.5 hover:text-indigo-600 cursor-pointer">
                  <Code className="w-4 h-4 text-indigo-600" />
                  <span>Rich Formatting</span>
                </button>
                <button onClick={() => setIsCreatePostOpen(true)} className="flex items-center space-x-1.5 hover:text-indigo-600 cursor-pointer">
                  <Image className="w-4 h-4 text-blue-600" />
                  <span>Cloudinary Image</span>
                </button>
              </div>
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + New Post
              </button>
            </div>
          </div>

          {/* Sample Posts */}
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              
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

                <div className="flex items-center space-x-2">
                  {post.isProOnly && (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 rounded-full border border-amber-200 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Pro Exclusive</span>
                    </span>
                  )}
                  <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    {post.communityName || 'SaaS Developers'}
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 my-2">
                  <img src={post.imageUrl} alt="Post Attachment" className="w-full max-h-80 object-cover" />
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      isLiked[post.id] ? 'text-rose-600 font-bold' : 'hover:text-slate-900'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked[post.id] ? 'fill-rose-600' : ''}`} />
                    <span>{likes[post.id] || post.likes} Likes</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{(postComments[post.id]?.length || 0) + post.comments} Comments</span>
                  </button>

                  <button className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors cursor-pointer">
                    <Share2 className="w-4 h-4" />
                    <span>{post.shares} Share</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSave(post.id)}
                  className={`transition-colors cursor-pointer ${
                    isSaved[post.id] ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved[post.id] ? 'fill-indigo-600' : ''}`} />
                </button>
              </div>

              {/* Nested Comments Component */}
              {commentsOpen[post.id] && (
                <NestedComments
                  comments={postComments[post.id] || []}
                  onAddComment={(text, parentId) => handleAddComment(post.id, text, parentId)}
                  onLikeComment={(commentId) => console.log('Liked comment', commentId)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

