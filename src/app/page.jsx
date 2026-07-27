'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import JobCard from '@/components/JobCard';
import JobDetailModal from '@/components/JobDetailModal';
import { IT_ROLES, classifyJobRole, isIndiaOrStrictlyRemote } from '@/lib/classification';
import {
  loadSavedJobs,
  persistSavedJobs,
  toggleSavedJob,
  refreshSavedSnapshots,
  resolveSavedJobsList,
  savedJobIdSet,
} from '@/lib/saved-jobs';

const COMPANIES = [
  'linkedin',
  'microsoft',
  'google',
  'amazon',
  'apple',
  'nvidia',
  'arbeitnow',
  'remotive',
  'remoteok',
  'jobicy',
  'hnjobs',
  'weworkremotely'
];

const COMPANY_META = {
  linkedin:       { label: 'LinkedIn',       color: '#0a66c2' },
  microsoft:      { label: 'Microsoft',      color: '#00a4ef' },
  google:         { label: 'Google',         color: '#4285f4' },
  amazon:         { label: 'Amazon',         color: '#ff9900' },
  apple:          { label: 'Apple',          color: '#a3a3a3' },
  nvidia:         { label: 'NVIDIA',         color: '#76b900' },
  arbeitnow:      { label: 'Arbeitnow',      color: '#4f46e5' },
  remotive:       { label: 'Remotive',       color: '#f59e0b' },
  remoteok:       { label: 'RemoteOK',       color: '#ff4742' },
  jobicy:         { label: 'Jobicy',         color: '#2563eb' },
  hnjobs:         { label: 'HN Jobs',        color: '#ff6600' },
  weworkremotely: { label: 'WeWorkRemotely', color: '#10b981' }
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

const LOCATION_FILTER_OPTIONS = [
  { value: 'all',    label: 'All Locations' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'india',  label: 'India / On-site' },
];

const PAGE_SIZE = 16;

function isDirectCompanyScraper(sourceCompany = '') {
  return ['microsoft', 'google', 'amazon', 'apple', 'nvidia'].includes((sourceCompany || '').toLowerCase());
}

function normalizeForDedup(str = '') {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
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

function matchesLocationFilter(location = '', filter = 'all') {
  if (filter === 'all') return true;
  const loc = (location || '').toLowerCase();
  if (filter === 'remote') {
    return loc.includes('remote') || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere');
  }
  if (filter === 'india') {
    return loc.includes('india') || loc.includes('bengaluru') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('mumbai') || loc.includes('chennai') || loc.includes('delhi') || loc.includes('gurugram');
  }
  return true;
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

function enrichJob(job, companyKey) {
  let displayCompany = job.company;
  if (!displayCompany || displayCompany.toLowerCase() === 'linkedin') {
    displayCompany = COMPANY_META[companyKey]?.label || job.company || 'Tech Company';
  }

  const applyUrl = job.applyUrl?.startsWith('/api/jobs/resolve-apply')
    ? job.applyUrl
    : `/api/jobs/resolve-apply?url=${encodeURIComponent(job.applyUrl || '')}`;

  return {
    ...job,
    company: displayCompany,
    applyUrl,
    classifiedRole: job.classifiedRole || classifyJobRole(job.title),
    sourceCompany: job.sourceCompany || companyKey,
  };
}

export default function Home() {
  const [allJobs,          setAllJobs]          = useState({});
  const [loadingCompanies, setLoadingCompanies]  = useState(new Set(COMPANIES));
  const [activeRole,       setActiveRole]        = useState('all');
  const [sourceFilter,     setSourceFilter]      = useState('all');
  const [locationFilter,   setLocationFilter]    = useState('all');
  const [fromCache,        setFromCache]         = useState(false);
  const [cacheAge,         setCacheAge]          = useState(null);
  const [search,           setSearch]            = useState('');
  const [sortBy,           setSortBy]            = useState('default');
  const [dateFilter,       setDateFilter]        = useState('any');
  const [visibleCount,     setVisibleCount]      = useState(PAGE_SIZE);
  const [selectedJob,      setSelectedJob]       = useState(null);
  const [savedJobsMap,     setSavedJobsMap]      = useState({});
  const [savedReady,       setSavedReady]        = useState(false);
  const [jobStatuses,      setJobStatuses]       = useState(() => getJobStatuses());
  const [showSaved,        setShowSaved]         = useState(false);

  const fetchStarted = useRef(false);
  const searchInputRef = useRef(null);

  // Hydrate saved snapshots on client mount (before any persist)
  useEffect(() => {
    setSavedJobsMap(loadSavedJobs());
    setSavedReady(true);
  }, []);

  const startStreaming = useCallback((force = false) => {
    setAllJobs({});
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
            if (done) {
              setLoadingCompanies(new Set());
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();

            parts.forEach(part => {
              const line = part.trim();
              if (!line.startsWith('data:')) return;
              try {
                const payload = JSON.parse(line.slice(5).trim());
                const { company: c, data, cached, cacheAge: age } = payload;

                setAllJobs(prev => ({ ...prev, [c]: data || [] }));
                setLoadingCompanies(prev => {
                  const next = new Set(prev);
                  next.delete(c);
                  return next;
                });
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
      .catch(() => {
        setLoadingCompanies(new Set());
      });
  }, []);

  // Bootstrap: kick off stream
  useEffect(() => {
    if (!fetchStarted.current) {
      fetchStarted.current = true;
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
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeRole, showSaved, dateFilter, sourceFilter, locationFilter, search]);

  // Persist saved snapshots only after hydration (avoids wiping storage with {})
  useEffect(() => {
    if (!savedReady) return;
    persistSavedJobs(savedJobsMap);
  }, [savedJobsMap, savedReady]);

  useEffect(() => {
    try { localStorage.setItem('career-radar-statuses', JSON.stringify(jobStatuses)); } catch {}
  }, [jobStatuses]);

  const handleToggleSave = useCallback((job) => {
    setSavedJobsMap(prev => toggleSavedJob(prev, job));
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
  const savedJobIds      = useMemo(() => savedJobIdSet(savedJobsMap), [savedJobsMap]);
  
  // Flatten, enrich, and cross-source deduplicate all jobs
  const allJobsFlat = useMemo(() => {
    const rawFlat = [];
    Object.entries(allJobs).forEach(([companyKey, jobsList]) => {
      if (Array.isArray(jobsList)) {
        jobsList.forEach(job => {
          // Strictly filter for jobs located in India or strictly Remote/Global/Worldwide
          if (!isIndiaOrStrictlyRemote(job.location)) return;
          rawFlat.push(enrichJob(job, companyKey));
        });
      }
    });

    // Cross-source semantic deduplication engine
    const dedupMap = new Map();
    rawFlat.forEach(job => {
      const normCompany = normalizeForDedup(job.company);
      const normTitle = normalizeForDedup(job.title);
      const dedupKey = `${normCompany}|${normTitle}`;

      if (!dedupMap.has(dedupKey)) {
        dedupMap.set(dedupKey, job);
      } else {
        const existing = dedupMap.get(dedupKey);
        const existingIsDirect = isDirectCompanyScraper(existing.sourceCompany);
        const newIsDirect = isDirectCompanyScraper(job.sourceCompany);

        if (newIsDirect && !existingIsDirect) {
          dedupMap.set(dedupKey, job);
        } else if (!existingIsDirect && !newIsDirect) {
          if (!existing.postedDate && job.postedDate) {
            dedupMap.set(dedupKey, job);
          } else if ((job.descriptionSnippet?.length || 0) > (existing.descriptionSnippet?.length || 0)) {
            dedupMap.set(dedupKey, job);
          }
        }
      }
    });

    return Array.from(dedupMap.values());
  }, [allJobs]);

  // Refresh saved snapshots when live jobs update (fill migrated shells + fresher fields)
  useEffect(() => {
    if (!allJobsFlat.length || !Object.keys(savedJobsMap).length) return;
    const refreshed = refreshSavedSnapshots(savedJobsMap, allJobsFlat);
    if (refreshed !== savedJobsMap) {
      setSavedJobsMap(refreshed);
    }
  }, [allJobsFlat]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalJobs = allJobsFlat.length;

  const savedJobs = useMemo(
    () => resolveSavedJobsList(savedJobsMap, allJobsFlat),
    [savedJobsMap, allJobsFlat]
  );

  const baseJobs = showSaved ? savedJobs : allJobsFlat;

  const sortedJobs = useMemo(() => {
    let result = [...baseJobs];

    if (!showSaved && activeRole !== 'all') {
      result = result.filter(j => j.classifiedRole === activeRole);
    }

    if (!showSaved && sourceFilter !== 'all') {
      result = result.filter(j => j.sourceCompany === sourceFilter);
    }

    if (!showSaved && locationFilter !== 'all') {
      result = result.filter(j => matchesLocationFilter(j.location, locationFilter));
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
  }, [baseJobs, activeRole, sourceFilter, locationFilter, search, sortBy, dateFilter, showSaved]);

  const paginatedJobs = useMemo(() => sortedJobs.slice(0, visibleCount), [sortedJobs, visibleCount]);
  const hasMore = sortedJobs.length > visibleCount;

  const isCurrentLoading = totalJobs === 0 && !isAllDone;
  const activeRoleLabel = IT_ROLES.find(r => r.id === activeRole)?.label || 'IT';

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-white/30 font-sans relative">
      <div className="starfield-sm" />
      <div className="starfield-md" />
      <div className="starfield-lg" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Compact Integrated Control Panel */}
        <div className="flex flex-col gap-3 mb-6 bg-white/5 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shadow-xl">

          {/* Top Bar: Stats + Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              {(totalJobs > 0 || isAllDone) && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>
                    Found <strong className="text-white font-semibold">{totalJobs} jobs</strong>
                    {' '}across <strong className="text-white font-semibold">{completedCount}</strong> sources
                  </span>
                  {!isAllDone && <span className="text-amber-400 font-medium animate-pulse"> · scanning...</span>}
                  {fromCache && cacheAge !== null && (
                    <span className="text-zinc-500 hidden md:inline"> · Served from cache ({Math.round(cacheAge / 60)}m ago)</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!showSaved && sortedJobs.length > 0 && isAllDone && (
                <button
                  onClick={() => exportToCSV(sortedJobs, activeRoleLabel)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-all border border-white/10"
                  title="Download visible jobs as CSV"
                >
                  ⬇ Export CSV ({sortedJobs.length})
                </button>
              )}

              <button
                onClick={() => startStreaming(true)}
                disabled={!isAllDone}
                title="Force re-scrape all directories"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-white/10"
              >
                ↺ Refresh
              </button>
            </div>
          </div>

          {/* Progress bar (when active scanning) */}
          {!isAllDone && (
            <div className="w-full">
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Scanning 12 global tech & company directories...</span>
                <span>{completedCount} / {COMPANIES.length} sources finished</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / COMPANIES.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* IT Role Tabs System */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-nowrap text-xs">
            <button
              onClick={() => setShowSaved(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all duration-200 shrink-0 ${
                showSaved
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              🔖 Saved
              {savedJobIds.size > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${showSaved ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-zinc-300'}`}>
                  {savedJobIds.size}
                </span>
              )}
            </button>

            <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

            {IT_ROLES.map(role => {
              const isActive = !showSaved && activeRole === role.id;
              const count = allJobsFlat.filter(j => role.id === 'all' || j.classifiedRole === role.id).length;

              return (
                <button
                  key={role.id}
                  onClick={() => { setActiveRole(role.id); setShowSaved(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {role.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + 4 Filter Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            <div className="relative lg:col-span-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, company, skills… (press / to focus)"
                className="w-full h-9 bg-zinc-950/80 border border-zinc-800 rounded-xl pl-8 pr-7 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* Source filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="h-9 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 transition-all cursor-pointer appearance-none pr-7 truncate"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="all" className="bg-zinc-950">All Sources (12)</option>
              {COMPANIES.map(c => (
                <option key={c} value={c} className="bg-zinc-950">
                  {COMPANY_META[c]?.label || c} ({allJobsFlat.filter(j => j.sourceCompany === c).length})
                </option>
              ))}
            </select>

            {/* Location filter */}
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="h-9 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 transition-all cursor-pointer appearance-none pr-7 truncate"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {LOCATION_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-950">{o.label}</option>)}
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="h-9 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 transition-all cursor-pointer appearance-none pr-7 truncate"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {DATE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-950">{o.label}</option>)}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-9 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 transition-all cursor-pointer appearance-none pr-7 truncate"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-950">{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Job Grid Content (Responsive 4-column layout on wider screens) */}
        <div className="relative min-h-[350px]">

          {isCurrentLoading && !showSaved && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
              <p className="text-zinc-400 font-medium animate-pulse">
                Initializing job search across all 12 sources...
              </p>
              <p className="text-zinc-600 text-xs">{completedCount} of {COMPANIES.length} sources completed</p>
            </div>
          )}

          {/* Saved empty state */}
          {showSaved && savedJobs.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-4xl block mb-3">🔖</span>
              <p className="text-base font-medium">No saved jobs yet</p>
              <p className="text-xs text-zinc-600 mt-1">Star a job card to save a full snapshot here for later.</p>
            </div>
          )}

          {(!isCurrentLoading || showSaved) && sortedJobs.length === 0 && !(showSaved && savedJobs.length === 0) && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-4xl block mb-3">{search ? '🔍' : '🚀'}</span>
              <p className="text-base font-medium">
                {search
                    ? `No jobs matching "${search}"`
                    : `No listings found for ${activeRoleLabel}.`}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-3 text-xs text-zinc-400 hover:text-white underline transition-colors">
                  Clear search
                </button>
              )}
            </div>
          )}

          {sortedJobs.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3 text-xs text-zinc-500 px-1">
                <span>
                  Showing <strong>{paginatedJobs.length}</strong> of <strong>{sortedJobs.length}</strong> job{sortedJobs.length !== 1 ? 's' : ''}
                  {showSaved ? ' saved' : ` matching ${activeRoleLabel}`}
                  {sourceFilter !== 'all' && ` · ${COMPANY_META[sourceFilter]?.label || sourceFilter}`}
                  {locationFilter !== 'all' && ` · ${LOCATION_FILTER_OPTIONS.find(o=>o.value===locationFilter)?.label}`}
                  {search && ` · "${search}"`}
                  {dateFilter !== 'any' && ` · ${DATE_FILTER_OPTIONS.find(o=>o.value===dateFilter)?.label}`}
                </span>
              </div>

              {/* 4-column responsive grid maximizing space usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
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
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-300"
                  >
                    Show More ({sortedJobs.length - visibleCount} remaining)
                  </button>
                </div>
              )}

              {!hasMore && sortedJobs.length > PAGE_SIZE && (
                <p className="mt-5 text-center text-xs text-zinc-600">
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
