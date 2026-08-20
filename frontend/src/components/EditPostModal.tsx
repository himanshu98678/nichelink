import React, { useState, useEffect } from 'react';
import { X, Sparkles, Bold, Italic, Code, Link2, List, ListOrdered, Quote, Send, ShieldAlert, Check, Loader2, Tag, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { Post } from '../types';
import { COMMUNITIES_DATA } from '../data/communities';
import { ImageUpload } from './ImageUpload';
import { RichTextEditor } from './RichTextEditor';
import { api } from '../services/api';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onPostUpdated?: (updatedPost: Post) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}) => {
  const { user, isAdmin } = useAuth();
  const { editPost } = usePost();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isProOnly, setIsProOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const MAX_CHAR_LIMIT = 5000;

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setImageUrl(post.imageUrl || '');
      setTags(post.tags || []);
      setIsProOnly(Boolean(post.isProOnly));
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().replace(/^#/, '')]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isContentEmpty = (html: string): boolean => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return !doc.body.textContent?.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isContentEmpty(content) && !imageUrl) {
      setErrorMessage('Please write something or attach an image before saving your post.');
      return;
    }

    if (content.length > MAX_CHAR_LIMIT) {
      setErrorMessage(`Content exceeds the maximum ${MAX_CHAR_LIMIT} character limit.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await editPost(post.id, content, tags, isProOnly, imageUrl ? [imageUrl] : []);
      
      const updatedPostObj: Post = {
        ...post,
        content,
        tags,
        isProOnly,
        imageUrl: imageUrl || undefined,
      };

      if (onPostUpdated) {
        onPostUpdated(updatedPostObj);
      }

      setSuccessMessage('Post updated successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">Edit Post</h3>
              <p className="text-xs text-slate-500">
                Updating post in <span className="font-bold text-slate-700">{post.communityName || 'General Hub'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Post Content Editor with Formatting Toolbar */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Discussion Content
            </label>
            <RichTextEditor
              value={content}
              onChange={(val) => setContent(val)}
              placeholder="Share your thoughts, architectural decisions, code patterns..."
              disabled={isSubmitting}
            />
          </div>

          {/* Reusable Image Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attached Media
            </label>
            <ImageUpload
              currentImage={imageUrl}
              onImageSelected={(_file, previewUrl) => setImageUrl(previewUrl)}
              onRemove={() => setImageUrl(undefined)}
              label=""
            />
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Topic Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type a tag & hit enter (e.g., TypeScript, NextJS)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Pro-Only Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Pro-Only Discussion</p>
                <p className="text-[11px] text-slate-500">Only verified Pro members can read and reply to this post</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isProOnly}
              onChange={(e) => setIsProOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isContentEmpty(content) && !imageUrl)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
