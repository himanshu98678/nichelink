import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw, Square, Trash2, Pencil, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface Project { id: string; title: string; }
interface Task { id: string; title: string; }
interface TimeRecord {
  id: string; projectId: string; taskId?: string | null; description?: string | null;
  project?: Project; task?: Task | null;
}
interface Timer extends TimeRecord { status: 'RUNNING' | 'PAUSED'; elapsedSeconds: number; }
interface Entry extends TimeRecord { status: 'COMPLETED'; startedAt: string; endedAt: string; accumulatedSeconds: number; durationMinutes?: number | null; }

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
};

export const TimeTrackingPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState<Timer | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [refreshAt, setRefreshAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    const query = new URLSearchParams();
    if (from) query.set('from', `${from}T00:00:00.000Z`);
    if (to) query.set('to', `${to}T23:59:59.999Z`);
    const response = await api.get<{ entries: Entry[] }>(`/time-tracking/entries${query.toString() ? `?${query}` : ''}`);
    setEntries(response.entries || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [projectResponse, timerResponse] = await Promise.all([
          api.get<{ projects?: Project[]; items?: Project[] }>('/projects?limit=100'),
          api.get<{ timer: Timer | null }>('/time-tracking/timer'),
        ]);
        const loadedProjects = projectResponse.projects || projectResponse.items || [];
        setProjects(loadedProjects);
        setTimer(timerResponse.timer);
        if (timerResponse.timer) {
          setProjectId(timerResponse.timer.projectId);
          setTaskId(timerResponse.timer.taskId || '');
          setNotes(timerResponse.timer.description || '');
        }
        await loadEntries();
      } catch (err: any) { setError(api.getFriendlyMessage(err)); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!projectId) { setTasks([]); return; }
    api.get<{ tasks?: Task[] }>(`/projects/${projectId}/tasks`)
      .then((response) => setTasks(response.tasks || []))
      .catch((err) => setError(api.getFriendlyMessage(err)));
  }, [projectId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const elapsedSeconds = timer?.status === 'RUNNING'
    ? timer.elapsedSeconds + Math.floor((now - refreshAt) / 1000)
    : timer?.elapsedSeconds || 0;
  const totalSeconds = useMemo(() => entries.reduce((total, entry) => total + (entry.accumulatedSeconds || (entry.durationMinutes || 0) * 60), 0), [entries]);

  const run = async (action: () => Promise<{ timer?: Timer; entry?: Entry }>) => {
    setBusy(true); setError(null);
    try {
      const response = await action();
      if (response.timer !== undefined) { setTimer(response.timer || null); setRefreshAt(Date.now()); }
      if (response.entry) { setTimer(null); setEntries((current) => [response.entry!, ...current]); }
    } catch (err: any) { setError(api.getFriendlyMessage(err)); }
    finally { setBusy(false); }
  };

  const start = () => run(() => api.post('/time-tracking/timer/start', { projectId, taskId: taskId || undefined, description: notes }));
  const stop = () => run(() => api.post('/time-tracking/timer/stop', { description: notes }));
  const pause = () => run(() => api.post('/time-tracking/timer/pause'));
  const resume = () => run(() => api.post('/time-tracking/timer/resume'));

  const editEntry = async (entry: Entry) => {
    const description = window.prompt('Update notes', entry.description || '');
    if (description === null) return;
    await run(async () => { await api.put(`/time-tracking/entries/${entry.id}`, { description }); await loadEntries(); return {}; });
  };

  const deleteEntry = async (entry: Entry) => {
    if (!window.confirm('Delete this time entry?')) return;
    await run(async () => { await api.delete(`/time-tracking/entries/${entry.id}`); await loadEntries(); return {}; });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Work rhythm</p><h1 className="text-3xl font-extrabold text-slate-900">Time tracking</h1><p className="text-sm text-slate-500 mt-1">Keep project hours accurate and easy to review.</p></div>
          <button type="button" onClick={() => { setLoading(true); Promise.all([loadEntries(), api.get<{ timer: Timer | null }>('/time-tracking/timer').then((response) => { setTimer(response.timer); setRefreshAt(Date.now()); })]).finally(() => setLoading(false)); }} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"><RefreshCw className="w-4 h-4" />Refresh</button>
        </header>
        {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}
        <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div><p className="text-xs uppercase tracking-widest text-slate-400">{timer ? `${timer.status.toLowerCase()} timer` : 'Ready to track'}</p><p className="text-5xl font-mono font-bold mt-2 tabular-nums">{formatDuration(elapsedSeconds)}</p></div>
            <div className="grid sm:grid-cols-2 gap-3 min-w-0 lg:min-w-[34rem]">
              <select disabled={!!timer || busy} value={projectId} onChange={(event) => { setProjectId(event.target.value); setTaskId(''); }} className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm"><option value="" className="text-slate-900">Select project</option>{projects.map((project) => <option className="text-slate-900" key={project.id} value={project.id}>{project.title}</option>)}</select>
              <select disabled={!!timer || busy || !projectId} value={taskId} onChange={(event) => setTaskId(event.target.value)} className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm"><option value="" className="text-slate-900">No task</option>{tasks.map((task) => <option className="text-slate-900" key={task.id} value={task.id}>{task.title}</option>)}</select>
              <input disabled={busy} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" className="sm:col-span-2 px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm placeholder:text-slate-400" />
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                {!timer && <button disabled={busy || !projectId} onClick={start} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-400 text-slate-950 rounded-lg text-sm font-bold disabled:opacity-40"><Play className="w-4 h-4" />Start</button>}
                {timer?.status === 'RUNNING' && <button disabled={busy} onClick={pause} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-300 text-slate-950 rounded-lg text-sm font-bold"><Pause className="w-4 h-4" />Pause</button>}
                {timer?.status === 'PAUSED' && <button disabled={busy} onClick={resume} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-400 text-slate-950 rounded-lg text-sm font-bold"><RotateCcw className="w-4 h-4" />Resume</button>}
                {timer && <button disabled={busy} onClick={stop} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-950 rounded-lg text-sm font-bold"><Square className="w-4 h-4" />Finish & save</button>}
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Timesheet</h2><p className="text-sm text-slate-500">{formatDuration(totalSeconds)} tracked in this view</p></div><div className="flex gap-2"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="px-2 py-2 border border-slate-200 rounded-lg text-xs" /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="px-2 py-2 border border-slate-200 rounded-lg text-xs" /><button onClick={() => loadEntries().catch((err) => setError(api.getFriendlyMessage(err)))} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold">Filter</button></div></div>
          {loading ? <p className="p-8 text-sm text-slate-500">Loading timesheet...</p> : entries.length === 0 ? <div className="p-10 text-center"><Clock3 className="w-8 h-8 mx-auto text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-600">No time entries yet</p></div> : <div className="divide-y divide-slate-100">{entries.map((entry) => <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-900">{entry.project?.title || 'Project'}{entry.task?.title ? ` / ${entry.task.title}` : ''}</p><p className="text-xs text-slate-500">{new Date(entry.startedAt).toLocaleString()} {entry.description ? `· ${entry.description}` : ''}</p></div><div className="flex items-center gap-3"><span className="font-mono text-sm font-bold text-slate-700">{formatDuration(entry.accumulatedSeconds || (entry.durationMinutes || 0) * 60)}</span><button title="Edit entry" onClick={() => editEntry(entry)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button><button title="Delete entry" onClick={() => deleteEntry(entry)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>}
        </section>
      </div>
    </div>
  );
};