import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, ArrowRight, Check, Sparkles, User, Code2, 
  Cpu, Palette, Globe, BookOpen, Briefcase, Rocket, ShieldCheck, CheckCircle2,
  Camera, Upload, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { CURATED_AVATARS } from '../components/ChangeAvatarModal';
import { api } from '../services/api';

const SKILL_OPTIONS = [
  'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PyTorch', 
  'LLMs', 'Vector DBs', 'Figma', 'UI/UX', 'Tailwind CSS', 'Rust', 
  'GraphQL', 'PostgreSQL', 'Stripe API', 'Async Work', 'Remote Nomading', 'System Design'
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding, updateProfile, joinedCommunityIds } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || CURATED_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [name, setName] = useState(user.name || 'Alex Morgan');
  const [role, setRole] = useState(user.role || 'Full-Stack SaaS Builder');
  const [location, setLocation] = useState(user.location || 'San Francisco, CA (Remote)');
  const [bio, setBio] = useState(user.bio || 'Passionate about building scalable web apps, AI workflows, and connecting with remote engineers.');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user.skills || ['TypeScript', 'React', 'Node.js', 'Tailwind CSS']);
  const { communities } = useCommunity();
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (communities.length > 0 && selectedCommunities.length === 0) {
      const initialJoined = communities.filter(c => c.isJoined).map(c => c.id);
      setSelectedCommunities(initialJoined.length > 0 ? initialJoined : [communities[0].id]);
    }
  }, [communities]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
      setErrorMsg('Unsupported file format. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('File is too large. Maximum allowed size is 5 MB.');
      return;
    }

    const previousAvatar = selectedAvatar;
    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatar(previewUrl);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'AVATAR');
      const response = await api.post<{ success: boolean; file: { url: string } }>('/uploads', formData);
      const permanentUrl = response.file?.url;
      if (!permanentUrl || permanentUrl.startsWith('blob:') || permanentUrl.startsWith('data:')) {
        throw new Error('The upload completed without a permanent avatar URL.');
      }
      setSelectedAvatar(permanentUrl);
      await updateProfile({ avatar: permanentUrl });
    } catch (err: any) {
      setSelectedAvatar(previousAvatar);
      setErrorMsg(api.getFriendlyMessage(err));
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    updateProfile({ avatar: url });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleCommunity = (id: string) => {
    setSelectedCommunities(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await completeOnboarding({
        name,
        role,
        bio,
        avatar: selectedAvatar,
        skills: selectedSkills,
        joinedCommunities: selectedCommunities,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(api.getFriendlyMessage(err));
      // Go back to step 1 to let user see error if it is name validation error, etc.
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
        
        {/* Top Progress Bar & Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                NicheLink Setup
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Step {step} of 4
            </span>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s ? 'bg-indigo-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Profile & Avatar Setup */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Set Up Your Builder Profile</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell your fellow remote peers who you are and what you craft.
              </p>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Profile Picture</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload custom photo</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />

              {/* Current Preview + Presets */}
              <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <img
                  src={selectedAvatar}
                  alt="Selected avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-indigo-600/30 shrink-0"
                />
                <div className="flex-1 overflow-x-auto no-scrollbar">
                  <div className="flex items-center space-x-2 py-1">
                    {CURATED_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleSelectAvatar(av.url)}
                        className={`relative rounded-xl p-0.5 transition-all cursor-pointer shrink-0 ${
                          selectedAvatar === av.url ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} className="w-10 h-10 rounded-xl object-cover" />
                        {selectedAvatar === av.url && (
                          <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. Senior SaaS Engineer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Timezone</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="e.g. Remote (UTC-5) / Berlin"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="What are you currently building or learning?"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Continue to Skills</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Skills & Tech Stack Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Select Your Craft & Tech Stack</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the tools, frameworks, and domains you specialize in for tailored post feeds & project matches.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {SKILL_OPTIONS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center space-x-3 text-xs text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Selected {selectedSkills.length} skills. We'll highlight relevant Project Matches based on these.</span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Choose Initial Tribes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Initial Communities to Join */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Join Your First Micro-Tribes</h2>
              <p className="text-xs text-slate-500 mt-1">
                Pick at least 1 community to immediately populate your dashboard activity feed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {communities.map((comm) => {
                const isJoined = selectedCommunities.includes(comm.id);
                return (
                  <div
                    key={comm.id}
                    onClick={() => toggleCommunity(comm.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isJoined
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                        {comm.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{comm.name}</h4>
                      <span className="text-[11px] text-slate-500">{comm.memberCount}</span>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      isJoined
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isJoined ? 'Joined' : '+ Join'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={selectedCommunities.length === 0}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Review & Finish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Ready to Enter Dashboard */}
        {step === 4 && (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                You're All Set, {name.split(' ')[0]}! 🚀
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your builder profile has been customized, your skill tags are mapped, and your feed is populated with {selectedCommunities.length} joined micro-tribes.
              </p>
            </div>

            {/* Checklist of unlocked features */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2.5 max-w-md mx-auto text-xs">
              <div className="flex items-center text-slate-700 space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Personalized Community Feed with real-time comments & reactions</span>
              </div>
              <div className="flex items-center text-slate-700 space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Socket.io Real-time Peer Messaging with online typing status</span>
              </div>
              <div className="flex items-center text-slate-700 space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Project Matchboard to find verified remote co-builders</span>
              </div>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold max-w-md mx-auto text-left">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving Profile...' : 'Enter Main Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
