import React, { useEffect, useState } from 'react';
import { api, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, DollarSign, Bookmark, Check, Search, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';

interface JobsSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

interface JobRecord {
  id: string;
  title: string;
  description?: string | null;
  company: string;
  location?: string | null;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  skills: string[];
  postedBy?: { id: string; avatar?: string | null };
  experienceLevel?: string | null;
  category?: string | null;
  expiresAt?: string | null;
  status?: 'OPEN' | 'CLOSED';
}

type JobForm = {
  title: string;
  description: string;
  company: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  category: string;
  salaryMin: string;
  salaryMax: string;
  skills: string;
  expiresAt: string;
};

const EMPTY_JOB_FORM: JobForm = {
  title: '', description: '', company: '', location: '', employmentType: '',
  experienceLevel: '', category: '', salaryMin: '', salaryMax: '', skills: '', expiresAt: '',
};

export const JobsSection: React.FC<JobsSectionProps> = ({ onOpenAuth }) => {
  const { isAuthenticated, user } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isManagementLoading, setIsManagementLoading] = useState(false);
  const [managementJobs, setManagementJobs] = useState<JobRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [jobForm, setJobForm] = useState<JobForm>(EMPTY_JOB_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const query = searchQuery.trim() ? `&keyword=${encodeURIComponent(searchQuery.trim())}` : '';
        const response = await api.get<{ success: boolean; items?: JobRecord[] }>(`/jobs?limit=20&status=OPEN${query}`);
        setJobs(response.items || []);
        if (isAuthenticated) {
          setIsManagementLoading(true);
          const [openResponse, closedResponse] = await Promise.all([
            api.get<{ success: boolean; items?: JobRecord[] }>(`/jobs?limit=100&status=OPEN${query}`),
            api.get<{ success: boolean; items?: JobRecord[] }>(`/jobs?limit=100&status=CLOSED${query}`),
          ]);
          const owned = [...(openResponse.items || []), ...(closedResponse.items || [])]
            .filter((job) => job.postedBy?.id === user.id);
          setManagementJobs(owned);
        } else {
          setManagementJobs([]);
        }
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
        setIsManagementLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, isAuthenticated, user.id]);

  const updateForm = (field: keyof JobForm, value: string) => {
    setJobForm((previous) => ({ ...previous, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingJob(null);
    setJobForm(EMPTY_JOB_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (job: JobRecord) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description || '',
      company: job.company,
      location: job.location || '',
      employmentType: job.employmentType || '',
      experienceLevel: job.experienceLevel || '',
      category: job.category || '',
      salaryMin: job.salaryMin?.toString() || '',
      salaryMax: job.salaryMax?.toString() || '',
      skills: job.skills.join(', '),
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '',
    });
    setIsFormOpen(true);
  };

  const handleJobSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    const payload = {
      ...jobForm,
      salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
      salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
      skills: jobForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      expiresAt: jobForm.expiresAt || null,
    };
    try {
      const response = editingJob
        ? await api.patch<{ success: boolean; job: JobRecord }>(`/jobs/${editingJob.id}`, payload)
        : await api.post<{ success: boolean; job: JobRecord }>('/jobs', payload);
      const savedJob = response.job;
      setManagementJobs((previous) => editingJob
        ? previous.map((job) => job.id === savedJob.id ? savedJob : job)
        : [savedJob, ...previous]);
      setJobs((previous) => editingJob
        ? previous.map((job) => job.id === savedJob.id ? savedJob : job).filter((job) => job.status !== 'CLOSED')
        : [savedJob, ...previous]);
      setIsFormOpen(false);
      setJobForm(EMPTY_JOB_FORM);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeJob = async (job: JobRecord) => {
    try {
      const response = await api.patch<{ success: boolean; job: JobRecord }>(`/jobs/${job.id}`, { status: 'CLOSED' });
      setManagementJobs((previous) => previous.map((item) => item.id === job.id ? response.job : item));
      setJobs((previous) => previous.filter((item) => item.id !== job.id));
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm('Delete this job permanently?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setManagementJobs((previous) => previous.filter((job) => job.id !== jobId));
      setJobs((previous) => previous.filter((job) => job.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  const openJobDetails = async (jobId: string) => {
    setIsDetailLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<{ success: boolean; job: JobRecord }>(`/jobs/${jobId}`);
      setSelectedJob(response.job);
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setAppliedJobs((prev) => ({ ...prev, [jobId]: true }));
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  const handleSave = async (jobId: string) => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    try {
      if (savedJobs[jobId]) {
        await api.delete(`/jobs/${jobId}/save`);
      } else {
        await api.post(`/jobs/${jobId}/save`, {});
      }
      setSavedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    }
  };

  return (
    <section id="jobs" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Curated Opportunities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Find opportunities that fit your niche.
            </h2>
            <p className="text-base text-gray-600">
              Direct job openings from tech startups, AI labs, and modern engineering teams seeking specialized talent.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="self-start md:self-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <span>Explore Jobs →</span>
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="mb-8 max-w-xl relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company, or skills (e.g. React, Rust, Figma)..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-600 transition-colors"
          />
        </div>

        {errorMessage && <p className="mb-6 text-sm text-rose-600">{errorMessage}</p>}

        {isAuthenticated && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Employer job management</h2>
                <p className="text-xs text-slate-500">Manage only listings posted by your account.</p>
              </div>
              <button type="button" onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"><Plus className="w-4 h-4" />Post a job</button>
            </div>
            {isManagementLoading && <p className="text-sm text-slate-500">Loading your jobs...</p>}
            {!isManagementLoading && managementJobs.length === 0 && <p className="text-sm text-slate-500">You have not posted any jobs yet.</p>}
            <div className="grid gap-3">
              {managementJobs.map((job) => (
                <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
                  <div><p className="font-semibold text-slate-900">{job.title}</p><p className="text-xs text-slate-500">{job.company} · {job.status || 'OPEN'}</p></div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openJobDetails(job.id)} title="View job details" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button type="button" onClick={() => openEditForm(job)} title="Edit job" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                    {job.status !== 'CLOSED' && <button type="button" onClick={() => closeJob(job)} className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg">Close</button>}
                    <button type="button" onClick={() => deleteJob(job.id)} title="Delete job" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedJob && (
          <section className="mb-8 bg-white border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">{selectedJob.title}</h2><p className="text-sm text-slate-600">{selectedJob.company} · {selectedJob.location || 'Remote'}</p></div><button type="button" onClick={() => setSelectedJob(null)} aria-label="Close details" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button></div>
            {isDetailLoading ? <p className="mt-4 text-sm text-slate-500">Loading details...</p> : <><p className="mt-4 text-sm text-slate-700 whitespace-pre-line">{selectedJob.description || 'No description provided.'}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span>Status: {selectedJob.status}</span><span>Type: {selectedJob.employmentType || 'Not specified'}</span><span>Experience: {selectedJob.experienceLevel || 'Not specified'}</span></div></>}
          </section>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {isLoading && <p className="text-sm text-gray-500">Loading jobs...</p>}
          {!isLoading && jobs.length === 0 && <p className="text-sm text-gray-500">No jobs matched your search.</p>}
          {jobs.map((job) => {
            const isApplied = appliedJobs[job.id];
            const isSaved = savedJobs[job.id];
            const salary = job.salaryMin || job.salaryMax
              ? `$${job.salaryMin?.toLocaleString() || '0'} - $${job.salaryMax?.toLocaleString() || '0'}`
              : 'Salary not specified';

            return (
              <div
                key={job.id}
                className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={resolveMediaUrl(job.postedBy?.avatar) || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80'}
                    alt={job.company}
                    className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-2xs shrink-0"
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        {job.employmentType || 'Open role'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-700 flex items-center space-x-3">
                      <span>{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center text-gray-500 font-normal">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {job.location || 'Remote'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center text-emerald-700 font-semibold">
                        <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                        {salary}
                      </span>
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <button
                    onClick={() => handleSave(job.id)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                        : 'border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
                    aria-label="Save job"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleApply(job.id)}
                    className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Application Submitted</span>
                      </>
                    ) : (
                      <span>Apply Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <form onSubmit={handleJobSubmit} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{editingJob ? 'Edit job' : 'Create job'}</h2><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close form" className="p-2 text-slate-500"><X className="w-4 h-4" /></button></div>
            {(['title', 'company', 'location', 'employmentType', 'experienceLevel', 'category', 'salaryMin', 'salaryMax', 'expiresAt'] as Array<keyof JobForm>).map((field) => <input key={field} value={jobForm[field]} onChange={(event) => updateForm(field, event.target.value)} placeholder={field} type={field === 'expiresAt' ? 'date' : field.startsWith('salary') ? 'number' : 'text'} required={field === 'title' || field === 'company'} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />)}
            <textarea value={jobForm.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="description" rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none" />
            <input value={jobForm.skills} onChange={(event) => updateForm('skills', event.target.value)} placeholder="skills, comma separated" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save job'}</button></div>
          </form>
        </div>
      )}
    </section>
  );
};
