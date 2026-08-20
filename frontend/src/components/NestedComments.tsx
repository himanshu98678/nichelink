import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, CornerDownRight, Trash2, Send, Loader2 } from 'lucide-react';
import { CommentItem, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { api } from '../services/api';

interface NestedCommentsProps {
  postId: string;
}

export const NestedComments: React.FC<NestedCommentsProps> = ({ postId }) => {
  const { user, isGuest, isAdmin } = useAuth();
  const { incrementPostCommentCount } = usePost();

  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const formatTimestamp = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const buildCommentTree = (flatComments: any[]): CommentItem[] => {
    const commentMap: Record<string, CommentItem & { replies: CommentItem[] }> = {};
    const roots: CommentItem[] = [];

    flatComments.forEach((c) => {
      commentMap[c.id] = {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        author: {
          id: c.user.id,
          name: c.user.name,
          username: `@${c.user.username}`,
          avatar: c.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          userRole: (c.user.role === 'ADMIN' || c.user.role === 'Admin' ? 'Admin' : c.user.role === 'PRO' || c.user.role === 'ProMember' ? 'ProMember' : 'FreeMember') as UserRole,
        },
        text: c.content,
        timestamp: c.createdAt ? formatTimestamp(c.createdAt) : 'Just now',
        likes: 0,
        isLiked: false,
        replies: [],
      };
    });

    flatComments.forEach((c) => {
      const mapped = commentMap[c.id];
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(mapped);
      } else {
        roots.push(mapped);
      }
    });

    return roots;
  };

  const loadComments = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<{ success: boolean; comments: any[] }>(`/posts/${postId}/comments`);
      if (res && res.comments) {
        setCommentsList(buildCommentTree(res.comments));
      }
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post(`/posts/${postId}/comments`, { content: newCommentText.trim() });
      setNewCommentText('');
      incrementPostCommentCount(postId, 1);
      await loadComments();
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post(`/comments/${parentId}/reply`, { content: replyText.trim() });
      setReplyText('');
      setReplyingToId(null);
      incrementPostCommentCount(postId, 1);
      await loadComments();
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.delete(`/comments/${commentId}`);
      incrementPostCommentCount(postId, -1);
      await loadComments();
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    Guest: { label: 'Guest', color: 'bg-slate-100 text-slate-600' },
    FreeMember: { label: 'Free', color: 'bg-blue-50 text-blue-700' },
    ProMember: { label: 'Pro', color: 'bg-indigo-100 text-indigo-800' },
    Admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 font-bold' },
  };

  const renderComment = (comment: CommentItem, isNested: boolean = false) => {
    const isOwner = comment.author.id === user.id;
    const canDelete = isOwner || isAdmin;
    const badge = roleBadges[comment.author.userRole || 'FreeMember'];

    return (
      <div key={comment.id} className={`space-y-3 ${isNested ? 'ml-6 sm:ml-10 pt-2 border-l-2 border-slate-200 pl-4' : 'pt-4 border-t border-slate-100'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">{comment.author.name}</span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full border ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-[11px] text-slate-400">{comment.timestamp}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">{comment.text}</p>
            </div>
          </div>

          {canDelete && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Delete Comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500 pl-9 sm:pl-10">
          <button
            className={`flex items-center space-x-1 transition-colors hover:text-slate-800`}
            title="Comment likes not supported by server"
          >
            <Heart className={`w-3.5 h-3.5`} />
            <span>0</span>
          </button>

          {!isGuest && (
            <button
              onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
              className="flex items-center space-x-1 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Inline Reply Form */}
        {replyingToId === comment.id && (
          <form
            onSubmit={(e) => handleReplySubmit(e, comment.id)}
            className="mt-3 ml-9 sm:ml-10 flex items-center space-x-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.author.name}...`}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center space-x-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Reply</span>
              )}
            </button>
          </form>
        )}

        {/* Render Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const totalCommentCount = commentsList.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200/80">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
          <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-600" />
          <span>Discussion Thread ({totalCommentCount})</span>
        </h4>
      </div>

      {/* Main Comment Input */}
      {isGuest ? (
        <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-600">
          Guests can read comments. Switch to <strong>FreeMember</strong> or <strong>ProMember</strong> to join the discussion.
        </div>
      ) : (
        <form onSubmit={handleMainSubmit} className="flex items-center space-x-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a constructive response or technical query..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading thread discussion...</span>
          </div>
        ) : commentsList.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No comments yet. Be the first to start the thread!</p>
        ) : (
          commentsList.map((comment) => renderComment(comment, false))
        )}
      </div>
    </div>
  );
};
