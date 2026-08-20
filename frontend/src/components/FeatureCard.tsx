import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Send, Layers, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';
import { Feature } from '../data/features';

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const renderIcon = (iconName: string) => {
    const className = "w-6 h-6 text-slate-900";
    switch (iconName) {
      case 'Users':
        return <Users className={className} />;
      case 'MessageSquare':
        return <MessageSquare className={className} />;
      case 'Send':
        return <Send className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      default:
        return <Users className={className} />;
    }
  };

  return (
    <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-105 transition-all">
            {renderIcon(feature.iconName)}
          </div>
          {feature.badge && (
            <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
              feature.badge === 'Pro' 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}>
              {feature.badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {feature.name}
        </h3>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {feature.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors space-x-1.5 group-hover:translate-x-0.5 transform duration-150"
        >
          <span>{feature.linkText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <span className="text-[11px] text-slate-400 font-medium">Sign in required</span>
      </div>
    </div>
  );
};
