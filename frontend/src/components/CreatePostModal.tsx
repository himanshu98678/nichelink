import React, { useState } from 'react';
import { X, Tag, Sparkles, Bold, Italic, Code, Link2, List, ListOrdered, Quote, Send, ShieldAlert, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { usePost } from '../context/PostContext';
import { Post } from '../types';
import { api } from '../services/api';
import { ImageUpload } from './ImageUpload';
import { RichTextEditor } from './RichTextEditor';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (newPost: Post) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { user, isGuest } = useAuth();
  const { communities } = useCommunity();
  const { addPost } = usePost();
  
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['SaaS', 'RemoteWork']);
  const [isProOnly, setIsProOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && !communityId) {
      const joinedCommunity = communities.find((community) => community.isJoined);
      setCommunityId(joinedCommunity?.id || '');
    }
  }, [isOpen, communities, communityId]);

  const MAX_CHAR_LIMIT = 5000;

  const isContentEmpty = (html: string): boolean => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return !doc.body.textContent?.trim();
  };

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().replace(/^#/, '')]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    setContent((prev) => {
      const next = `${prev}${prefix}Text${suffix}`;
      return next.slice(0, MAX_CHAR_LIMIT);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (imageUploadError) {
      setErrorMessage(imageUploadError);
      return;
    }

    if (isContentEmpty(content) && !imageUrl) {
      setErrorMessage('Please write something or attach an image before posting.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addPost({
        content: content.trim(),
        communityId: communityId || undefined,
        tags,
        isProOnly,
        images: imageUrl ? [imageUrl] : []
      });

      setSuccessMessage('Post published successfully.');
      setContent('');
      setImageUrl('');
      setIsSubmitting(false);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
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
            <h3 className="text-xl font-bold text-slate-900">Create New Discussion Post</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
            {successMessage}
          </div>
        )}

        {/* Guest Guard */}
        {isGuest ? (
          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 text-center">
            <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
            <h4 className="text-base font-bold text-amber-900">Guest Read-Only Mode</h4>
            <p className="text-xs text-amber-800">
              You are currently viewing as a Guest. Switch to <strong>FreeMember</strong>, <strong>ProMember</strong>, or <strong>Admin</strong> in the RBAC banner to publish posts!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Target Community Hub Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Community Tribe
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Public feed (no community)</option>
                {communities.map((comm) => (
                  comm.isJoined && (
                  <option key={comm.id} value={comm.id}>
                    {comm.name} ({comm.category})
                  </option>
                  )
                ))}
              </select>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Discussion Content
              </label>
              <RichTextEditor
                value={content}
                onChange={(val) => setContent(val)}
                placeholder="Share formatted technical details or insights..."
                disabled={isSubmitting}
              />
            </div>

            {/* Reusable Image Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Attached Media
              </label>
              <ImageUpload
                currentImage={imageUrl}
                onImageSelected={(_file, previewUrl) => setImageUrl(previewUrl)}
                onRemove={() => {
                  setImageUrl(undefined);
                  setImageUploadError(null);
                }}
                onUploadStateChange={setIsImageUploading}
                onUploadError={setImageUploadError}
                label=""
              />
            </div>

            {/* Topic Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Topic Hashtags</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Add hashtag (e.g., Rust, SystemDesign)..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-indigo-400 hover:text-indigo-900 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pro Only Toggle */}
            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Pro Member Exclusive Content</span>
                <span className="text-[11px] text-slate-500">Only Pro & Admin members can view this thread.</span>
              </div>
              <input
                type="checkbox"
                checked={isProOnly}
                onChange={(e) => setIsProOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isImageUploading || (isContentEmpty(content) && !imageUrl)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
