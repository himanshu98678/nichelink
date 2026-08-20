import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Sparkles, UserPlus } from 'lucide-react';
import { PROJECTS_DATA } from '../data/projects';
import { Button } from '../components/Button';

export const ProjectMatchSection: React.FC = () => {
  return (
    <section id="projects" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collaboration Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find People to Build With.
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Turn ideas into real projects by finding professionals with complementary skills.
          </p>
        </div>

        {/* Example Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PROJECTS_DATA.slice(0, 2).map((project) => (
            <div
              key={project.id}
              className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Looking for: {project.lookingFor}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {project.timeAgo}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {project.title}
                </h3>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {project.description}
                </p>

                {/* Skills tags */}
                <div className="mt-6">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Required Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Creator info & Button */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={project.creator.avatar}
                    alt={project.creator.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {project.creator.name}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {project.creator.role}
                    </span>
                  </div>
                </div>

                <Button to={`/projects/${project.id}`} variant="outline" size="sm" className="space-x-1.5">
                  <span>View Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Main CTA */}
        <div className="mt-12 text-center">
          <Button to="/projects" variant="primary" size="lg" className="space-x-2">
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

      </div>
    </section>
  );
};
