import React, { useEffect, useState } from 'react';
import { Search as SearchIcon, Users, Briefcase, ListTodo, FolderKanban } from 'lucide-react';
import { api } from '../services/api';

type SearchType = 'users' | 'jobs' | 'tasks' | 'projects';

interface SearchResult {
  id: string;
  type: SearchType;
  title?: string;
  name?: string;
  username?: string;
  company?: string;
  location?: string | null;
  status?: string;
  priority?: string;
  description?: string | null;
  project?: { title?: string };
}

const searchTabs: Array<{ id: SearchType; label: string; icon: React.ElementType }> = [
  { id: 'users', label: 'People', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
];

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<SearchType>('users');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await api.get<{ success: boolean; items?: SearchResult[] }>(
          `/search?q=${encodeURIComponent(normalizedQuery)}&type=${activeType}&limit=30`,
        );
        setResults(response.items || []);
      } catch (err: any) {
        setResults([]);
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query, activeType]);

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Global Search</span>
          <h1 className="text-3xl font-extrabold text-slate-900">Find people, work, and opportunities</h1>
          <p className="text-sm text-slate-600">Search results are loaded from the platform database.</p>
        </div>

        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, skill, title, or keyword..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Search categories">
          {searchTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveType(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${activeType === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {errorMessage && <p className="mb-4 text-sm text-rose-600">{errorMessage}</p>}
        {isLoading && <p className="text-sm text-slate-500">Searching...</p>}
        {!isLoading && !errorMessage && !query.trim() && <p className="text-sm text-slate-500">Enter a search term to begin.</p>}
        {!isLoading && !errorMessage && query.trim() && results.length === 0 && <p className="text-sm text-slate-500">No {activeType} matched your search.</p>}

        <div className="grid gap-3">
          {results.map((result) => (
            <article key={result.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{result.title || result.name || result.company || 'Search result'}</h2>
                  {result.username && <p className="text-xs text-indigo-600">@{result.username.replace(/^@/, '')}</p>}
                  {result.company && result.title && <p className="text-sm text-slate-600">{result.company}{result.location ? ` · ${result.location}` : ''}</p>}
                  {result.project?.title && <p className="text-xs text-slate-500">Project: {result.project.title}</p>}
                  {result.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{result.description}</p>}
                </div>
                {(result.status || result.priority) && <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{result.status || result.priority}</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
