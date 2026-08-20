import React from 'react';
import { currentUserProfile } from '../data/mockData';
import { 
  ShieldCheck, MapPin, Building, GraduationCap, Briefcase, 
  Github, Linkedin, Twitter, Globe, Sparkles, FolderKanban, Check
} from 'lucide-react';

interface ProfilePreviewProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ onOpenAuth }) => {
  const profile = currentUserProfile;

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Identity & Credibility</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            NicheLink Verified Professional Profile
          </h2>
          <p className="text-base text-gray-600">
            A comprehensive, clean developer identity showcasing real experience, verified skills, and active open source contributions.
          </p>
        </div>

        {/* Profile Card Mockup */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="h-36 sm:h-48 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 relative">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
              Pro Member Verified
            </div>
          </div>

          {/* Profile Header content */}
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4">
              <div className="relative">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl"
                />
                <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Online now" />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Connect Profile
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Message
                </button>
              </div>
            </div>

            {/* Name & Title */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {profile.name}
                </h3>
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                <span className="text-xs text-gray-500 font-medium">{profile.username}</span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-indigo-700">
                {profile.role}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium pt-1">
                <span className="flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {profile.company}
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {profile.location}
                </span>
                <span className="flex items-center text-indigo-600 font-bold">
                  <FolderKanban className="w-3.5 h-3.5 mr-1" />
                  {profile.projectsCount} Active Projects
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-3xl">
              {profile.bio}
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100 text-gray-600">
              <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={profile.socialLinks.website} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>

            {/* Skills Badges */}
            <div className="mt-6 space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Verified Skills & Expertise:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience & Education Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              {/* Experience */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center">
                  <Briefcase className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Experience History
                </h4>
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl space-y-0.5">
                    <h5 className="text-sm font-bold text-gray-900">{exp.role}</h5>
                    <p className="text-xs text-gray-600">{exp.company} • {exp.period}</p>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Education
                </h4>
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl space-y-0.5">
                    <h5 className="text-sm font-bold text-gray-900">{edu.degree}</h5>
                    <p className="text-xs text-gray-600">{edu.school} • {edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
