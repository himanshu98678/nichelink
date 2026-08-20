import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, ArrowRight, Check, Flame, Sparkles, Lock,
  Code2, Cpu, Palette, Rocket, Globe, BookOpen, Briefcase, ShieldCheck, Plus 
} from 'lucide-react';
import { Community } from '../types';

interface CommunityCardProps {
  community: Community;
  isJoined?: boolean;
  onToggleJoin?: (id: string) => void;
  showDetailLink?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community, 
  isJoined = false, 
  onToggleJoin,
  showDetailLink = true 
}) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code2':
        return Code2;
      case 'Cpu':
        return Cpu;
      case 'Palette':
        return Palette;
      case 'Rocket':
        return Rocket;
      case 'Globe':
        return Globe;
      case 'BookOpen':
        return BookOpen;
      case 'Briefcase':
        return Briefcase;
      case 'Shield':
      case 'ShieldCheck':
        return ShieldCheck;
      default:
        return Users;
    }
  };

  const Icon = getIcon(community.iconName);

  return (
    <div className="group bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Corner gradient overlay accent from Join Free section */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 via-slate-50/50 to-transparent rounded-bl-full pointer-events-none" />

      <div className="relative z-10">
        {/* Card Header: Icon & Live Active Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex items-center space-x-2">
            {community.isProOnly && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center">
                <Lock className="w-3 h-3 mr-1 text-amber-600" />
                Pro Exclusive
              </span>
            )}
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              {community.activeNowCount || community.activityLevel || 'Active Hub'}
            </span>
          </div>
        </div>

        {/* Category Pill */}
        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md inline-block border border-indigo-100/80">
          {community.category}
        </span>

        {/* Community Title */}
        <h3 className="text-xl font-bold text-slate-900 mt-2.5 group-hover:text-indigo-600 transition-colors">
          {community.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {community.description}
        </p>

        {/* Recent Topic or Featured Project Snippet */}
        {community.recentTopic ? (
          <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2 text-[11px] text-slate-700">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic font-medium">"{community.recentTopic}"</span>
          </div>
        ) : community.featuredProject ? (
          <div className="mt-3.5 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex items-start space-x-2 text-[11px] text-indigo-900">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <span className="line-clamp-1 font-semibold">Project: {community.featuredProject}</span>
          </div>
        ) : null}

        {/* Hashtags */}
        {community.tags && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
        <div className="flex items-center text-xs font-bold text-slate-700 space-x-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{community.members || community.memberCount}</span>
        </div>

        <div className="flex items-center space-x-2">
          {showDetailLink && (
            <Link
              to={`/communities/${community.id}`}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center space-x-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {onToggleJoin && (
            <button
              onClick={() => onToggleJoin(community.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                isJoined
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
              }`}
            >
              {isJoined ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Joined</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join Hub</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

