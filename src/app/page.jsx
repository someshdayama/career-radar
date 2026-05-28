'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import JobCard from '@/components/JobCard';

const COMPANIES = ['linkedin', 'microsoft', 'google', 'amazon', 'apple', 'nvidia'];

const COMPANY_META = {
  linkedin:  { label: 'LinkedIn',  color: '#0a66c2' },
  microsoft: { label: 'Microsoft', color: '#00a4ef' },
  google:    { label: 'Google',    color: '#4285f4' },
  amazon:    { label: 'Amazon',    color: '#ff9900' },
  apple:     { label: 'Apple',     color: '#ffffff' },
  nvidia:    { label: 'Nvidia',    color: '#76b900' },
};

const SORT_OPTIONS = [
  { value: 'default',  label: 'Default Order' },
  { value: 'title-az', label: 'Title A → Z' },
  { value: 'title-za', label: 'Title Z → A' },
  { value: 'company',  label: 'Company' },
];

function getSavedBookmarks() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('career-radar-bookmarks') || '{}'); } catch { return {}; }
}

function getSeenJobIds() {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem('career-radar-seen') || '[]')); } catch { return new Set(); }
}

function markJobsAsSeen(jobs) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSeenJobIds();
    jobs.forEach(j => existing.add(j.id));
    localStorage.setItem('career-radar-seen', JSON.stringify([...existing]));
  } catch {}
}

export default function Home() {
  const [allJobs,          setAllJobs]          = useState({});
  const [companyErrors,    setCompanyErrors]     = useState({});
  const [loadingCompanies, setLoadingCompanies]  = useState(new Set(COMPANIES));
  const [company,          setCompany]           = useState('linkedin');
  const [showBookmarks,    setShowBookmarks]     = useState(false);
  const [bookmarks,        setBookmarks]         = useState({});
  const [fromCache,        setFromCache]         = useState(false);
  const [cacheAge,         setCacheAge]          = useState(null);
  const [seenIds,          setSeenIds]           = useState(new Set());
  const [search,           setSearch]            = useState('');
  const [sortBy,           setSortBy]            = useState('default');

  const fetchStarted = useRef(false);

  const startStreaming = useCallback(() => {
    setAllJobs({});
    setCompanyErrors({});
    setLoadingCompanies(new Set(COMPANIES));
    setFromCache(false);
    setCacheAge(null);

    fetch('/api/jobs/stream')
      .then(res => {
        if (!res.ok || !res.body) throw new Error('Stream unavailable');
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const pump = () =>
          reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();

            parts.forEach(part => {
              const line = part.trim();
              if (!line.startsWith('data:')) return;
              try {
                const payload = JSON.parse(line.slice(5).trim());
                const { company: c, data, error, cached, cacheAge: age } = payload;

                setAllJobs(prev => ({ ...prev, [c]: data }));
                setLoadingCompanies(prev => {
                  const next = new Set(prev);
                  next.delete(c);
                  return next;
                });
                if (error) setCompanyErrors(prev => ({ ...prev, [c]: error }));
                if (cached) { setFromCache(true); setCacheAge(age); }
                if (data?.length) markJobsAsSeen(data);
              } catch (e) {
                console.warn('Failed to parse SSE chunk:', e);
              }
            });
            return pump();
          });

        return pump();
      })
      .catch(() => setLoadingCompanies(new Set()));
  }, []);

  // Bootstrap: load localStorage state + kick off stream
  useEffect(() => {
    setBookmarks(getSavedBookmarks());
    setSeenIds(getSeenJobIds());

    if (!fetchStarted.current) {
      fetchStarted.current = true;
      startStreaming();
    }
  }, [startStreaming]);

  // Event-driven bookmark sync (replaces the 1-second polling interval)
  useEffect(() => {
    const sync = () => setBookmarks(getSavedBookmarks());
    window.addEventListener('storage', sync);        // cross-tab sync
    window.addEventListener('bookmarkChanged', sync); // same-tab from JobCard
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('bookmarkChanged', sync);
    };
  }, []);

  // Keyboard ← → to switch company tabs
  useEffect(() => {
    const handleKey = e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        setShowBookmarks(false);
        setCompany(prev => COMPANIES[(COMPANIES.indexOf(prev) + 1) % COMPANIES.length]);
      } else if (e.key === 'ArrowLeft') {
        setShowBookmarks(false);
        setCompany(prev => COMPANIES[(COMPANIES.indexOf(prev) - 1 + COMPANIES.length) % COMPANIES.length]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Derived values — memoised to avoid recomputing on every render
  const isAllDone        = loadingCompanies.size === 0;
  const completedCount   = COMPANIES.length - loadingCompanies.size;
  const isCurrentLoading = !showBookmarks && loadingCompanies.has(company);
  const totalJobs        = useMemo(
    () => Object.values(allJobs).reduce((s, j) => s + j.length, 0),
    [allJobs]
  );
  const bookmarkedJobs = useMemo(
    () => Object.values(allJobs).flat().filter(j => bookmarks[j.id]),
    [allJobs, bookmarks]
  );
  const baseJobs = showBookmarks ? bookmarkedJobs : (allJobs[company] || []);

  const sortedJobs = useMemo(() => {
    let result = [...baseJobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.descriptionSnippet?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'title-az') result.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'title-za') result.sort((a, b) => b.title.localeCompare(a.title));
    if (sortBy === 'company')  result.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    return result;
  }, [baseJobs, search, sortBy]);

  const currentError = !showBookmarks ? companyErrors[company] : null;

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-white/30 font-sans">

      <div className="starfield-sm" />
      <div className="starfield-md" />
      <div className="starfield-lg" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Career Radar
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Discover top opportunities across the tech industry — scraped live from company careers pages.
          </p>

          {totalJobs > 0 && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="text-sm text-zinc-500">
                Found <span className="text-white font-semibold">{totalJobs} jobs</span> across{' '}
                <span className="text-white font-semibold">{completedCount} companies</span>
                {!isAllDone && <span className="text-amber-400"> · scanning...</span>}
              </p>
              {fromCache && cacheAge !== null && (
                <p className="text-xs text-zinc-600">
                  ⚡ Served from cache · updated {Math.round(cacheAge / 60)}m ago
                  <button onClick={startStreaming} className="ml-2 text-zinc-500 hover:text-white underline transition-colors">
                    Refresh
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isAllDone && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Scanning companies in parallel...</span>
              <span>{completedCount} / {COMPANIES.length} done</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${(completedCount / COMPANIES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex flex-col gap-4 mb-8 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">

          {/* Company tabs + Bookmarks + Refresh */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-wrap">
              {COMPANIES.map(id => {
                const meta     = COMPANY_META[id];
                const scanning = loadingCompanies.has(id);
                const count    = (allJobs[id] || []).length;
                const hasError = !!companyErrors[id];
                const isActive = !showBookmarks && company === id;

                return (
                  <button
                    key={id}
                    onClick={() => { setCompany(id); setShowBookmarks(false); }}
                    title={hasError ? `Failed to scrape ${meta.label}` : undefined}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/20'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {meta.label}
                    {!scanning && count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                        {count}
                      </span>
                    )}
                    {scanning && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />}
                    {hasError && !scanning && <span title="Scrape failed" className="text-red-400 text-xs">⚠</span>}
                  </button>
                );
              })}

              {/* Bookmarks tab */}
              <button
                onClick={() => setShowBookmarks(true)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                  showBookmarks
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                🔖 Saved
                {bookmarkedJobs.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showBookmarks ? 'bg-black/20 text-black' : 'bg-amber-400/20 text-amber-400'}`}>
                    {bookmarkedJobs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={startStreaming}
              disabled={!isAllDone}
              title="Force re-scrape all companies"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ↺ Refresh
            </button>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, location..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/30 transition-all cursor-pointer appearance-none pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-zinc-700 mb-6 text-center hidden md:block">
          Tip: Use ← → arrow keys to switch companies
        </p>

        {/* Content */}
        <div className="relative min-h-[400px]">
          {currentError && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span>⚠</span>
              <span>Could not scrape {COMPANY_META[company]?.label}: {currentError}</span>
            </div>
          )}

          {isCurrentLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
              <p className="text-zinc-400 font-medium animate-pulse">
                Scraping {COMPANY_META[company]?.label}...
              </p>
              <p className="text-zinc-600 text-sm">{completedCount} of {COMPANIES.length} companies ready</p>
            </div>
          )}

          {!isCurrentLoading && sortedJobs.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-5xl block mb-4">{showBookmarks ? '🔖' : search ? '🔍' : '🚀'}</span>
              <p className="text-lg font-medium">
                {showBookmarks
                  ? 'No saved jobs yet. Bookmark any card to save it here.'
                  : search
                    ? `No jobs matching "${search}"`
                    : `No listings found for ${COMPANY_META[company]?.label}.`}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-4 text-sm text-zinc-500 hover:text-white underline transition-colors">
                  Clear search
                </button>
              )}
            </div>
          )}

          {!isCurrentLoading && sortedJobs.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 mb-4">
                Showing {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
                {showBookmarks ? ' saved' : ` at ${COMPANY_META[company]?.label}`}
                {search && ` · filtered by "${search}"`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {sortedJobs.map(job => (
                  <JobCard key={job.id} job={job} isNew={!seenIds.has(job.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
