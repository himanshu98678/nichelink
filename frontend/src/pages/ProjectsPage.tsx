import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle2, Sparkles, Plus, Lock, Send, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { api } from '../services/api';

interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  bannerImage?: string | null;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    role?: string;
  };
}

interface TaskRecord {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  deadline?: string | null;
  assignee?: { id: string; name: string; email?: string } | null;
}

export const ProjectsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { canPostProjectMatch, setIsCheckoutOpen, user, isGuest } = useAuth();

  const [projectsList, setProjectsList] = useState<ProjectRecord[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // New Project Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lookingFor, setLookingFor] = useState('Frontend & AI Engineer');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, LLMs');
  const [projectBanner, setProjectBanner] = useState<string | null>(null);

  const [singleProject, setSingleProject] = useState<ProjectRecord | null>(null);

  const selectedProject = id ? (projectsList.find((p) => p.id === id) || singleProject) : null;

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await api.get<{ success: boolean; items?: ProjectRecord[]; projects?: ProjectRecord[] }>('/projects?limit=100');
        setProjectsList(response.projects || response.items || []);
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    if (!id) {
      setSingleProject(null);
      return;
    }
    const loadSingle = async () => {
      try {
        const response = await api.get<{ success: boolean; project: ProjectRecord }>(`/projects/${id}`);
        if (response.project) {
          setSingleProject(response.project);
        }
      } catch (err) {
        // Handled gracefully
      }
    };
    loadSingle();
  }, [id]);

  useEffect(() => {
    if (!id || isGuest) return;
    const loadTasks = async () => {
      setIsTasksLoading(true);
      setTaskError(null);
      try {
        const response = await api.get<{ success: boolean; tasks?: TaskRecord[] }>(`/projects/${id}/tasks`);
        setTasks(response.tasks || []);
      } catch (err: any) {
        setTaskError(api.getFriendlyMessage(err));
      } finally {
        setIsTasksLoading(false);
      }
    };
    loadTasks();
  }, [id, isGuest]);

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !taskTitle.trim()) return;
    setTaskSubmitting(true);
    setTaskError(null);
    try {
      const response = await api.post<{ success: boolean; task: TaskRecord }>(`/projects/${id}/tasks`, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        status: taskStatus,
        priority: taskPriority,
      });
      setTasks((previous) => [response.task, ...previous]);
      setTaskTitle('');
      setTaskDescription('');
    } catch (err: any) {
      setTaskError(api.getFriendlyMessage(err));
    } finally {
      setTaskSubmitting(false);
    }
  };

  const updateTaskStatus = async (task: TaskRecord, status: string) => {
    if (!id) return;
    setTaskError(null);
    try {
      const response = await api.put<{ success: boolean; task: TaskRecord }>(`/projects/${id}/tasks/${task.id}`, { status });
      setTasks((previous) => previous.map((item) => item.id === task.id ? response.task : item));
    } catch (err: any) {
      setTaskError(api.getFriendlyMessage(err));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!id) return;
    setTaskError(null);
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
    } catch (err: any) {
      setTaskError(api.getFriendlyMessage(err));
    }
  };

  const toggleApply = async (projId: string) => {
    if (joinedProjects.includes(projId)) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.post(`/projects/${projId}/members`, { userId: user.id, role: 'MEMBER' });
      setJoinedProjects((previous) => [...previous, projId]);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await api.post<{ success: boolean; project: ProjectRecord }>('/projects', {
        title,
        description,
        status: 'PLANNING',
        priority: 'MEDIUM',
        bannerImage: projectBanner,
      });

      if (response.project) {
        setProjectsList((previous) => [response.project, ...previous]);
      }
      setTitle('');
      setDescription('');
      setProjectBanner(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedProject) {
    const isApplied = joinedProjects.includes(selectedProject.id);

    return (
      <div className="min-h-screen bg-slate-50/50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/projects"
            className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Projects
          </Link>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            {selectedProject.bannerImage && (
              <img src={selectedProject.bannerImage} alt="" className="w-full h-40 object-cover rounded-2xl" />
            )}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>Looking for: {(selectedProject as any).lookingFor || 'Collaborators'}</span>
              </span>
              <span className="text-xs text-slate-500">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedProject.title}
            </h1>

            <div className="flex items-center space-x-3 py-2">
              <img
                src={selectedProject.owner?.avatar || (selectedProject as any).creator?.avatar || user.avatar}
                alt={selectedProject.owner?.name || (selectedProject as any).creator?.name || 'NicheLink member'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <span className="block text-sm font-bold text-slate-900">{selectedProject.owner?.name || (selectedProject as any).creator?.name || 'NicheLink member'}</span>
                <span className="block text-xs text-slate-500">{selectedProject.owner?.role || selectedProject.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Brief</h3>
              <p className="text-base text-slate-700 leading-relaxed">{selectedProject.description}</p>
            </div>

            <section className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Project Tasks</h2>
                  <p className="text-xs text-slate-500">Tasks are shared with authorized project members.</p>
                </div>
                {isTasksLoading && <span className="text-xs text-slate-400">Loading...</span>}
              </div>
              {taskError && <p className="text-xs text-rose-600">{taskError}</p>}
              <form onSubmit={handleCreateTask} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="New task title" required className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => <option key={priority}>{priority}</option>)}
                </select>
                <button type="submit" disabled={taskSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{taskSubmitting ? 'Adding...' : 'Add Task'}</button>
                <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Optional task description" rows={2} className="sm:col-span-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none" />
              </form>
              {!isTasksLoading && tasks.length === 0 && <p className="text-sm text-slate-500">No tasks have been added to this project.</p>}
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 truncate">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={task.status === 'IN_PROGRESS' ? 'in-progress' : task.status} onChange={(event) => updateTaskStatus(task, event.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs">
                        {[['TODO', 'TODO'], ['in-progress', 'IN_PROGRESS'], ['REVIEW', 'REVIEW'], ['DONE', 'DONE']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button type="button" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => toggleApply(selectedProject.id)}
                disabled={isSubmitting || isApplied}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isApplied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                }`}
              >
                {isApplied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Project Joined</span>
                  </>
                ) : (
                  <span>Apply to Collaborate →</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project Match & Collaboration Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Find People to Build With
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Discover active projects from engineers, designers, and founders seeking complementary skills.
          </p>

          <div className="pt-2">
            {canPostProjectMatch ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Collaboration Request</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Upgrade to Pro to Post Requests</span>
              </button>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading && <p className="md:col-span-2 text-center text-sm text-slate-500">Loading projects...</p>}
          {!isLoading && projectsList.length === 0 && <p className="md:col-span-2 text-center text-sm text-slate-500">No projects available yet.</p>}
          {projectsList.map((project) => {
            return (
              <div
                key={project.id}
                className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {project.bannerImage && (
                    <img src={project.bannerImage} alt="" className="w-full h-32 object-cover rounded-2xl mb-4" />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{project.title}</h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{project.description}</p>

                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={project.owner?.avatar || user.avatar}
                      alt={project.owner?.name || 'NicheLink member'}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{project.owner?.name || 'NicheLink member'}</span>
                      <span className="block text-[11px] text-slate-500">{project.owner?.role || project.status}</span>
                    </div>
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* New Project Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Post Collaboration Request (Pro)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Building AI Voice Assistant for Customer Support"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Looking For Role
                </label>
                <input
                  type="text"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="e.g., Senior Full-Stack Engineer & Co-Founder"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Brief & Milestones
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product vision, current stage, and revenue model..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Required Stack (Comma Separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g., React, Python, FastApi, WebSockets"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Project Screenshot / Architecture Diagram Upload */}
              <ImageUpload
                currentImage={projectBanner || undefined}
                onImageSelected={(_file, previewUrl) => setProjectBanner(previewUrl)}
                onRemove={() => setProjectBanner(null)}
                category="PROJECT"
                label="Project Screenshot / Architecture Diagram (Optional)"
                aspectRatio="wide"
                maxSize={5 * 1024 * 1024}
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

