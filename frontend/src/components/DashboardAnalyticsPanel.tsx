import React, { useEffect, useState } from 'react';
import { Activity, Briefcase, CheckCircle2, Clock3, FolderKanban, MessageSquare, RefreshCw, Target } from 'lucide-react';
import { api } from '../services/api';

interface Analytics {
  metrics: {
    projects: { total: number; byStatus: Record<string, number> };
    tasks: { total: number; completed: number; pending: number; completionRate: number };
    jobs: { total: number; byStatus: Record<string, number> };
    trackedTime: { seconds: number; hours: number };
    messagesSent: number;
    activityCount: number;
    communitiesJoined: number;
    subscription: { planCode: string; status: string; endsAt?: string | null } | null;
  };
  time: { byProject: Array<{ projectId: string; title: string; seconds: number }>; byDay: Array<{ date: string; seconds: number }> };
}

const formatHours = (seconds: number) => `${Math.round((seconds / 3600) * 10) / 10}h`;

export const DashboardAnalyticsPanel: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.get<{ analytics: Analytics }>(`/dashboard/analytics?period=${period}`);
      setAnalytics(response.analytics);
    } catch (err: any) { setError(api.getFriendlyMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);

  if (loading) return <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs"><p className="text-sm text-slate-500">Loading your analytics...</p></section>;
  if (error) return <section className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs"><p className="text-sm text-rose-600">{error}</p><button onClick={load} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-700"><RefreshCw className="w-3.5 h-3.5" />Retry</button></section>;
  if (!analytics) return null;

  const { metrics, time } = analytics;
  const maxProjectSeconds = Math.max(...time.byProject.map((project) => project.seconds), 1);
  const maxDaySeconds = Math.max(...time.byDay.map((day) => day.seconds), 1);
  const projectStatus = Object.entries(metrics.projects.byStatus);
  const jobStatus = Object.entries(metrics.jobs.byStatus);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Performance overview</p><h2 className="text-xl font-extrabold text-slate-900">Work analytics</h2><p className="text-xs text-slate-500 mt-1">Aggregated from your authorized projects and activity.</p></div><div className="inline-flex self-start sm:self-auto p-1 bg-white border border-slate-200 rounded-lg">{(['week', 'month', 'year'] as const).map((value) => <button key={value} onClick={() => setPeriod(value)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize ${period === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{value}</button>)}</div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric icon={<FolderKanban className="w-4 h-4" />} label="Projects" value={metrics.projects.total} detail={projectStatus.map(([status, count]) => `${status}: ${count}`).join(' · ') || 'No projects'} color="indigo" /><Metric icon={<Target className="w-4 h-4" />} label="Task completion" value={`${metrics.tasks.completionRate}%`} detail={`${metrics.tasks.completed} done · ${metrics.tasks.pending} pending`} color="emerald" /><Metric icon={<Clock3 className="w-4 h-4" />} label="Tracked time" value={formatHours(metrics.trackedTime.seconds)} detail={`${period} period`} color="amber" /><Metric icon={<Briefcase className="w-4 h-4" />} label="Jobs posted" value={metrics.jobs.total} detail={jobStatus.map(([status, count]) => `${status}: ${count}`).join(' · ') || 'No jobs'} color="purple" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs"><div className="flex items-center justify-between mb-5"><div><h3 className="text-sm font-bold text-slate-900">Time by project</h3><p className="text-xs text-slate-500">Tracked hours in the selected period</p></div><Activity className="w-4 h-4 text-indigo-500" /></div>{time.byProject.length === 0 ? <Empty text="No tracked project time yet" /> : <div className="space-y-4">{time.byProject.slice(0, 6).map((project) => <div key={project.projectId}><div className="flex justify-between gap-3 text-xs mb-1"><span className="font-semibold text-slate-700 truncate">{project.title}</span><span className="font-mono text-slate-500">{formatHours(project.seconds)}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(4, (project.seconds / maxProjectSeconds) * 100)}%` }} /></div></div>)}</div>}</div><div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs"><div className="flex items-center justify-between mb-5"><div><h3 className="text-sm font-bold text-slate-900">Daily activity</h3><p className="text-xs text-slate-500">Time tracked by day</p></div><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>{time.byDay.length === 0 ? <Empty text="No daily activity yet" /> : <div className="flex items-end gap-2 h-32">{time.byDay.slice(-14).map((day) => <div key={day.date} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1"><div title={`${day.date}: ${formatHours(day.seconds)}`} className="w-full max-w-7 bg-emerald-400 rounded-t" style={{ height: `${Math.max(5, (day.seconds / maxDaySeconds) * 100)}%` }} /><span className="text-[9px] text-slate-400 rotate-[-45deg] origin-top-left whitespace-nowrap">{day.date.slice(5)}</span></div>)}</div>}</div></div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />{metrics.messagesSent} messages sent</span><span className="inline-flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />{metrics.activityCount} task activities</span><span>{metrics.communitiesJoined} communities joined</span><span>Plan: {metrics.subscription?.planCode || 'FREE'} · {metrics.subscription?.status || 'ACTIVE'}</span></div>
    </section>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string | number; detail: string; color: 'indigo' | 'emerald' | 'amber' | 'purple' }> = ({ icon, label, value, detail, color }) => {
  const iconClass = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', amber: 'text-amber-600', purple: 'text-purple-600' }[color];
  return <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span><span className={iconClass}>{icon}</span></div><p className="text-2xl font-extrabold text-slate-900 mt-2">{value}</p><p className="text-[10px] text-slate-500 mt-1 truncate">{detail}</p></div>;
};
const Empty: React.FC<{ text: string }> = ({ text }) => <div className="h-32 flex items-center justify-center text-xs text-slate-400">{text}</div>;