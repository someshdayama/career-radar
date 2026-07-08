'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import JobCard from '@/components/JobCard';
import JobDetailModal from '@/components/JobDetailModal';
import { IT_ROLES, classifyJobRole } from '@/lib/classification';

const COMPANIES = ['linkedin', 'microsoft', 'google', 'amazon', 'apple', 'nvidia', 'arbeitnow', 'remotive'];

const COMPANY_META = {
  linkedin:    { label: 'LinkedIn',    color: '#0a66c2' },
  microsoft:   { label: 'Microsoft',   color: '#00a4ef' },
  google:      { label: 'Google',      color: '#4285f4' },
  amazon:      { label: 'Amazon',      color: '#ff9900' },
  apple:       { label: 'Apple',       color: '#ffffff' },
  nvidia:      { label: 'NVIDIA',      color: '#76b900' },
  arbeitnow:   { label: 'Arbeitnow',   color: '#4f46e5' },
  remotive:    { label: 'Remotive',    color: '#f59e0b' },
};

const SORT_OPTIONS = [
  { value: 'default',  label: 'Default Order' },
  { value: 'title-az', label: 'Title A → Z' },
  { value: 'title-za', label: 'Title Z → A' },
  { value: 'company',  label: 'Company' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'any',  label: 'Any time' },
  { value: '24h',  label: 'Last 24h' },
  { value: '7d',   label: 'Last 7 days' },
  { value: '30d',  label: 'Last 30 days' },
];

const PAGE_SIZE = 12;

function isDirectCompanyScraper(sourceCompany = '') {
  return ['microsoft', 'google', 'amazon', 'apple', 'nvidia'].includes((sourceCompany || '').toLowerCase());
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

function getSavedJobIds() {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem('career-radar-saved') || '[]')); } catch { return new Set(); }
}

function getJobStatuses() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('career-radar-statuses') || '{}'); } catch { return {}; }
}

function isWithinDateRange(postedDate, range) {
  if (range === 'any' || !postedDate) return true;
  const ts = Date.parse(postedDate);
  if (isNaN(ts)) return true;
  const ms = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }[range];
  return (Date.now() - ts) <= ms;
}

function exportToCSV(jobs, filterLabel) {
  const header = ['Title', 'Company', 'Location', 'Posted', 'Apply URL'];
  const rows = jobs.map(j => [
    `"${(j.title || '').replace(/"/g, '""')}"`,
    `"${(j.company || '').replace(/"/g, '""')}"`,
    `"${(j.location || '').replace(/"/g, '""')}"`,
    `"${j.postedDate || ''}"`,
    `"${j.applyUrl || ''}"`,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `career-radar-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [allJobs,          setAllJobs]          = useState({});
  const [companyErrors,    setCompanyErrors]     = useState({});
  const [loadingCompanies, setLoadingCompanies]  = useState(new Set(COMPANIES));
  const [activeRole,       setActiveRole]        = useState('all');
  const [fromCache,        setFromCache]         = useState(false);
  const [cacheAge,         setCacheAge]          = useState(null);
  const [search,           setSearch]            = useState('');
  const [sortBy,           setSortBy]            = useState('default');
  const [dateFilter,       setDateFilter]        = useState('any');
  const [visibleCount,     setVisibleCount]      = useState(PAGE_SIZE);
  const [selectedJob,      setSelectedJob]       = useState(null);
  const [savedJobIds,      setSavedJobIds]       = useState(() => getSavedJobIds());
  const [jobStatuses,      setJobStatuses]       = useState(() => getJobStatuses());
  const [showSaved,        setShowSaved]         = useState(false);

  const fetchStarted = useRef(false);
  const searchInputRef = useRef(null);

  const startStreaming = useCallback((force = false) => {
    setAllJobs({});
    setCompanyErrors({});
    setLoadingCompanies(new Set(COMPANIES));
    setFromCache(false);
    setCacheAge(null);
    setVisibleCount(PAGE_SIZE);

    const url = force ? '/api/jobs/stream?refresh=true' : '/api/jobs/stream';
    fetch(url)
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

  // Bootstrap: kick off stream
  useEffect(() => {
    if (!fetchStarted.current) {
      fetchStarted.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startStreaming();
    }
  }, [startStreaming]);

  // Keyboard: ← switch roles, / focus search, Escape clear search
  useEffect(() => {
    const handleKey = e => {
      if (e.key === '/') {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        return;
      }
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        setShowSaved(false);
        setActiveRole(prev => {
          const idx = IT_ROLES.findIndex(r => r.id === prev);
          return IT_ROLES[(idx + 1) % IT_ROLES.length].id;
        });
        setVisibleCount(PAGE_SIZE);
      } else if (e.key === 'ArrowLeft') {
        setShowSaved(false);
        setActiveRole(prev => {
          const idx = IT_ROLES.findIndex(r => r.id === prev);
          return IT_ROLES[(idx - 1 + IT_ROLES.length) % IT_ROLES.length].id;
        });
        setVisibleCount(PAGE_SIZE);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Reset pagination when active role/filter changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeRole, showSaved, dateFilter, search]);

  // Persist saved + statuses to localStorage
  useEffect(() => {
    try { localStorage.setItem('career-radar-saved', JSON.stringify([...savedJobIds])); } catch {}
  }, [savedJobIds]);

  useEffect(() => {
    try { localStorage.setItem('career-radar-statuses', JSON.stringify(jobStatuses)); } catch {}
  }, [jobStatuses]);

  const handleToggleSave = useCallback((jobId) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback((jobId, status) => {
    setJobStatuses(prev => {
      const next = { ...prev };
      if (!status) delete next[jobId];
      else next[jobId] = status;
      return next;
    });
  }, []);

  // Derived values
  const isAllDone        = loadingCompanies.size === 0;
  const completedCount   = COMPANIES.length - loadingCompanies.size;
  const totalJobs        = useMemo(
    () => Object.values(allJobs).reduce((s, j) => s + j.length, 0),
    [allJobs]
  );

  // Flatten and dynamically enrich all jobs
  const allJobsFlat = useMemo(() => {
    const flat = [];
    Object.entries(allJobs).forEach(([companyKey, jobsList]) => {
      if (Array.isArray(jobsList)) {
        jobsList.forEach(job => {
          const classified = classifyJobRole(job.title);
          
          // Determine friendly display name for company
          let displayCompany = job.company;
          if (!displayCompany || displayCompany.toLowerCase() === 'linkedin') {
            displayCompany = COMPANY_META[companyKey]?.label || job.company || 'Tech Company';
          }

          // Resolve application links through redirect bypasser API
          const resolvedApplyUrl = `/api/jobs/resolve-apply?url=${encodeURIComponent(job.applyUrl)}`;

          flat.push({
            ...job,
            company: displayCompany,
            applyUrl: resolvedApplyUrl,
            classifiedRole: classified,
            sourceCompany: companyKey,
          });
        });
      }
    });
    return flat;
  }, [allJobs]);

  const savedJobs = useMemo(
    () => allJobsFlat.filter(j => savedJobIds.has(j.id)),
    [allJobsFlat, savedJobIds]
  );

  const baseJobs = showSaved ? savedJobs : allJobsFlat;

  const sortedJobs = useMemo(() => {
    let result = [...baseJobs];

    // Filter by active IT role tab
    if (!showSaved && activeRole !== 'all') {
      result = result.filter(j => j.classifiedRole === activeRole);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.descriptionSnippet?.toLowerCase().includes(q)
      );
    }
    if (dateFilter !== 'any') {
      result = result.filter(j => isWithinDateRange(j.postedDate, dateFilter));
    }
    
    // Sort direct company scrapers first, then the rest
    result.sort((a, b) => {
      const aDirect = isDirectCompanyScraper(a.sourceCompany);
      const bDirect = isDirectCompanyScraper(b.sourceCompany);
      
      if (aDirect && !bDirect) return -1;
      if (!aDirect && bDirect) return 1;
      
      if (sortBy === 'title-az') return a.title.localeCompare(b.title);
      if (sortBy === 'title-za') return b.title.localeCompare(a.title);
      if (sortBy === 'company')  return (a.company || '').localeCompare(b.company || '');
      return 0;
    });

    return result;
  }, [baseJobs, activeRole, search, sortBy, dateFilter, showSaved]);

  const paginatedJobs = useMemo(() => sortedJobs.slice(0, visibleCount), [sortedJobs, visibleCount]);
  const hasMore = sortedJobs.length > visibleCount;

  // Active errors list
  const errorsList = Object.entries(companyErrors).filter(([_, err]) => err);

  const isCurrentLoading = totalJobs === 0 && !isAllDone;

  const activeRoleLabel = IT_ROLES.find(r => r.id === activeRole)?.label || 'IT';

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-white/30 font-sans">

      <div className="starfield-sm" />
      <div className="starfield-md" />
      <div className="starfield-lg" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header / Stats */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4 empty:hidden">
          {totalJobs > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-500">
                Found <span className="text-white font-semibold">{totalJobs} jobs</span> across{' '}
                <span className="text-white font-semibold">{completedCount} sources</span>
                {!isAllDone && <span className="text-amber-400"> · scanning...</span>}
              </p>
              {fromCache && cacheAge !== null && (
                <p className="text-xs text-zinc-600">
                  ⚡ Served from cache · updated {Math.round(cacheAge / 60)}m ago
                  <button onClick={() => startStreaming(true)} className="ml-2 text-zinc-500 hover:text-white underline transition-colors">
                    Refresh
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Export CSV */}
          {!showSaved && sortedJobs.length > 0 && isAllDone && (
            <button
              onClick={() => exportToCSV(sortedJobs, activeRoleLabel)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all border border-white/10"
              title="Download visible jobs as CSV"
            >
              ⬇ Export CSV ({sortedJobs.length})
            </button>
          )}
        </div>

        {/* Progress bar */}
        {!isAllDone && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Scanning global and company directories...</span>
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

          {/* IT Role tabs + Saved tab + Refresh */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-wrap">

              {/* Saved tab */}
              <button
                onClick={() => setShowSaved(true)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                  showSaved
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                🔖 Saved
                {savedJobIds.size > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showSaved ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-zinc-300'}`}>
                    {savedJobIds.size}
                  </span>
                )}
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {IT_ROLES.map(role => {
                const isActive = !showSaved && activeRole === role.id;
                const count = allJobsFlat.filter(j => role.id === 'all' || j.classifiedRole === role.id).length;

                return (
                  <button
                    key={role.id}
                    onClick={() => { setActiveRole(role.id); setShowSaved(false); }}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/20'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {role.label}
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

            </div>

            {/* Refresh */}
            <button
              onClick={() => startStreaming(true)}
              disabled={!isAllDone}
              title="Force re-scrape all directories"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ↺ Refresh
            </button>
          </div>

          {/* Search + Sort + Date filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, company, skills… (press / to focus)"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/30 transition-all cursor-pointer appearance-none pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              {DATE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
            </select>

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
          Tip: ← → arrow keys to switch IT role tabs · / to search
        </p>

        {/* Content */}
        <div className="relative min-h-[400px]">
          {/* Active warnings */}
          {!showSaved && errorsList.map(([c, err]) => (
            <div key={c} className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span>⚠</span>
              <span>Could not scrape {COMPANY_META[c]?.label || c}: {err}</span>
            </div>
          ))}

          {isCurrentLoading && !showSaved && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
              <p className="text-zinc-400 font-medium animate-pulse">
                Initializing job search across all sources...
              </p>
              <p className="text-zinc-600 text-sm">{completedCount} of {COMPANIES.length} sources completed</p>
            </div>
          )}

          {/* Saved empty state */}
          {showSaved && savedJobs.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-5xl block mb-4">🔖</span>
              <p className="text-lg font-medium">No saved jobs yet</p>
              <p className="text-sm text-zinc-600 mt-2">Star a job card to save it here for later.</p>
            </div>
          )}

          {(!isCurrentLoading || showSaved) && sortedJobs.length === 0 && !(showSaved && savedJobs.length === 0) && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-5xl block mb-4">{search ? '🔍' : '🚀'}</span>
              <p className="text-lg font-medium">
                {search
                    ? `No jobs matching "${search}"`
                    : `No listings found for ${activeRoleLabel}.`}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-4 text-sm text-zinc-500 hover:text-white underline transition-colors">
                  Clear search
                </button>
              )}
            </div>
          )}

          {sortedJobs.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 mb-4">
                Showing {paginatedJobs.length} of {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
                {showSaved ? ' saved' : ` matching ${activeRoleLabel}`}
                {search && ` · filtered by "${search}"`}
                {dateFilter !== 'any' && ` · ${DATE_FILTER_OPTIONS.find(o=>o.value===dateFilter)?.label}`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {paginatedJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSelect={setSelectedJob}
                    isSaved={savedJobIds.has(job.id)}
                    onToggleSave={handleToggleSave}
                    jobStatus={jobStatuses[job.id]}
                  />
                ))}
              </div>

              {/* Show More button */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-zinc-300 hover:text-white transition-all duration-300"
                  >
                    Show More ({sortedJobs.length - visibleCount} remaining)
                  </button>
                </div>
              )}

              {!hasMore && sortedJobs.length > PAGE_SIZE && (
                <p className="mt-6 text-center text-xs text-zinc-600">
                  Showing all {sortedJobs.length} jobs
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          jobStatuses={jobStatuses}
          onStatusChange={handleStatusChange}
        />
      )}
    </main>
  );
}
