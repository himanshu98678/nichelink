import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Image as ImageIcon, Check, Sparkles, RefreshCw, 
  Camera, Link as LinkIcon, User, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from './ImageUpload';
import { api } from '../services/api';

export const CURATED_AVATARS = [
  {
    id: 'av_1',
    label: 'Alex (Default)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_2',
    label: 'Marcus (Engineer)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_3',
    label: 'Sarah (AI Lead)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_4',
    label: 'Elena (Fullstack)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_5',
    label: 'David (Founder)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_6',
    label: 'Jordan (Designer)',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_7',
    label: 'Aria (Backend)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_8',
    label: 'Lucas (Mobile)',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_9',
    label: 'Maya (Product)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_10',
    label: 'Kenji (DevOps)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_11',
    label: 'Chloe (Web3)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_12',
    label: 'Liam (Cloud)',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  },
];

export const ChangeAvatarModal: React.FC = () => {
  const { user, updateProfile, isAvatarModalOpen, setIsAvatarModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(user.avatar || CURATED_AVATARS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync with current user avatar on open
  useEffect(() => {
    if (isAvatarModalOpen) {
      setSelectedAvatarUrl(user.avatar || CURATED_AVATARS[0].url);
      setCustomUrlInput('');
      setIsSuccessToast(false);
      setIsSaving(false);
      setErrorMsg('');
    }
  }, [isAvatarModalOpen, user.avatar]);

  if (!isAvatarModalOpen) return null;

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setSelectedAvatarUrl(customUrlInput.trim());
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarUrl) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      await updateProfile({
        avatar: selectedAvatarUrl,
      });

      setIsSuccessToast(true);
      setTimeout(() => {
        setIsSuccessToast(false);
        setIsAvatarModalOpen(false);
      }, 900);
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Profile Picture</h3>
              <p className="text-xs text-slate-500">Upload a photo, paste a link, or choose an avatar</p>
            </div>
          </div>
          <button
            onClick={() => setIsAvatarModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Live Avatar Preview Section */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="relative shrink-0">
              <img
                src={selectedAvatarUrl}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-indigo-600/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = CURATED_AVATARS[0].url;
                }}
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full shadow-sm">
                <Check className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Live Preview</span>
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
            {selectedAvatarUrl !== user.avatar && (
              <button
                type="button"
                onClick={() => setSelectedAvatarUrl(user.avatar)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Method Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Avatars</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Image URL</span>
            </button>
          </div>

          {/* TAB 1: Preset Avatars Grid */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-56 overflow-y-auto p-1">
                {CURATED_AVATARS.map((av) => {
                  const isSelected = selectedAvatarUrl === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(av.url)}
                      className={`relative group rounded-2xl p-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-3 ring-indigo-600 bg-indigo-50/50 scale-105 shadow-md'
                          : 'hover:bg-slate-100 opacity-80 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-12 h-12 rounded-xl object-cover mx-auto"
                      />
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 text-center">Click any avatar to select it instantly.</p>
            </div>
          )}

          {/* TAB 2: Local File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <ImageUpload
                currentImage={selectedAvatarUrl.startsWith('data:') || selectedAvatarUrl.startsWith('blob:') ? selectedAvatarUrl : undefined}
                onImageSelected={(_file, previewUrl) => {
                  setSelectedAvatarUrl(previewUrl);
                }}
                onRemove={() => {
                  setSelectedAvatarUrl(user.avatar || CURATED_AVATARS[0].url);
                }}
                maxSize={5 * 1024 * 1024}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/jpg']}
                label="Profile Picture Upload"
                category="AVATAR"
                aspectRatio="square"
              />
            </div>
          )}

          {/* TAB 3: Web Image URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyCustomUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Direct Image Web Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                You can paste your Gravatar, GitHub avatar, LinkedIn image, or any public image URL.
              </p>
            </form>
          )}

          {/* Success indicator feedback */}
          {isSuccessToast && (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-xl text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile picture updated successfully!</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center space-x-2 bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs font-bold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(false)}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAvatar}
            disabled={isSuccessToast || isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Picture...' : 'Save Profile Picture'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
