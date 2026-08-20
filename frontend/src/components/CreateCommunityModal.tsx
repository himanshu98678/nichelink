import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Plus, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { Community } from '../types';
import { ImageUpload } from './ImageUpload';
import { api } from '../services/api';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated?: (community: Community) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCommunityCreated,
}) => {
  const { isAdmin, userRole, setUserRole } = useAuth();

  const { createCommunity } = useCommunity();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('React, TypeScript, RemoteWork');
  const [isProOnly, setIsProOnly] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createCommunity({
        name: name.trim(),
        description: description.trim(),
        category,
        tags: tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
        coverImage,
        isProOnly
      });

      setName('');
      setDescription('');
      setCoverImage(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-bold text-slate-900">Create New Community Hub (Admin)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdmin ? (
          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 space-y-4 text-center">
            <Lock className="w-8 h-8 text-purple-600 mx-auto" />
            <h4 className="text-base font-bold text-purple-900">Admin Privileges Required</h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              Creating persistent micro-communities is restricted to platform <strong>Admin</strong> users. Click below to instantly assume the Admin role in RBAC live mode!
            </p>
            <button
              onClick={() => setUserRole('Admin')}
              className="px-5 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition-all cursor-pointer shadow-xs"
            >
              Switch Role to Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tribe / Hub Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rust High Performance Engineering"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="Engineering">Engineering & Code</option>
                <option value="AI & Data">AI & Data Science</option>
                <option value="Design">Design & UI/UX</option>
                <option value="Business">Business & Founders</option>
                <option value="Lifestyle">Nomad & Lifestyle</option>
                <option value="Content & Docs">Technical Writing & Docs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the mission, topics, and guidelines of this vertical tribe..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                required
              />
            </div>

            {/* Community Cover Banner Image */}
            <ImageUpload
              currentImage={coverImage || undefined}
              onImageSelected={(_file, previewUrl) => setCoverImage(previewUrl)}
              onRemove={() => setCoverImage(null)}
              category="COMMUNITY"
              label="Community Cover Banner (Optional)"
              aspectRatio="wide"
              maxSize={5 * 1024 * 1024}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Rust, WebAssembly, Async"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Pro Member Exclusive Hub</span>
                <span className="text-[11px] text-slate-500">Only Pro Members and Admins can join this community.</span>
              </div>
              <input
                type="checkbox"
                checked={isProOnly}
                onChange={(e) => setIsProOnly(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Hub'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
