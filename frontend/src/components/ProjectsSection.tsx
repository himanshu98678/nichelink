import React, { useState } from 'react';
import { sampleProjects } from '../data/mockData';
import { Rocket, Users, ArrowRight, Check, Plus, FolderKanban, Sparkles } from 'lucide-react';

interface ProjectsSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onOpenAuth }) => {
  const [joinedProjects, setJoinedProjects] = useState<Record<string, boolean>>({ proj_2: true });

  const toggleJoinProject = (id: string) => {
    setJoinedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="projects" className="py-20 bg-gray-50 border-y border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Build & Co-Create
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Collaborate on Meaningful Open Projects
            </h2>
            <p className="text-base text-gray-600">
              Stop building in isolation. Team up with developers, designers, and domain experts to ship real software.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="self-start md:self-auto px-6 py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-sm shadow-md hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <span>Discover Projects →</span>
          </button>
        </div>

        {/* Projects Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sampleProjects.map((proj) => {
            const isJoined = joinedProjects[proj.id];

            return (
              <div
                key={proj.id}
                className="bg-white p-7 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Open Spots */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-lg">
                      {proj.category}
                    </span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      🔥 {proj.spotsOpen} Open Collaborator Spots
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {proj.title}
                  </h3>

                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Skills required */}
                  <div className="mt-5 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Skills Needed:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-700">Development Milestone Progress</span>
                      <span className="text-indigo-600">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Members & Join Button */}
                <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                  {/* Member avatars */}
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <img
                        src={proj.lead.avatar}
                        alt={proj.lead.name}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs"
                        title={`Lead: ${proj.lead.name}`}
                      />
                      {proj.members.map((m, idx) => (
                        <img
                          key={idx}
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-500 ml-1">
                      {proj.members.length + 1} active members
                    </span>
                  </div>

                  {/* Join / Collaborate button */}
                  <button
                    onClick={() => toggleJoinProject(proj.id)}
                    className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isJoined
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined Project Room</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Join & Collaborate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
