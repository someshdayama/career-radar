'use client';

import { useState, useEffect, useRef } from 'react';
import JobCard from '@/components/JobCard';

const COMPANIES = ['microsoft', 'google', 'amazon', 'apple', 'nvidia'];
const COMPANY_LABELS = {
  microsoft: 'Microsoft',
  google: 'Google',
  amazon: 'Amazon',
  apple: 'Apple',
  nvidia: 'Nvidia',
};



function getSavedBookmarks() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('career-radar-bookmarks') || '{}'); } catch { return {}; }
}

export default function Home() {
  const [allJobs, setAllJobs] = useState({});
  const [loadingCompanies, setLoadingCompanies] = useState(new Set(COMPANIES));
  const [error, setError] = useState(null);
  const [company, setCompany] = useState('microsoft');
  const [isMounted, setIsMounted] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const [fromCache, setFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState(null);
  const fetchStarted = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    setBookmarks(getSavedBookmarks());

    // Re-sync bookmarks when localStorage changes (e.g. from JobCard toggles)
    const syncBookmarks = () => setBookmarks(getSavedBookmarks());
    window.addEventListener('storage', syncBookmarks);

    if (!fetchStarted.current) {
      fetchStarted.current = true;
      startStreaming();
    }
    return () => window.removeEventListener('storage', syncBookmarks);
  }, []);

  // Refresh bookmarks whenever a card might have toggled one
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => setBookmarks(getSavedBookmarks()), 1000);
    return () => clearInterval(interval);
  }, [isMounted]);

  const startStreaming = () => {
    setAllJobs({});
    setLoadingCompanies(new Set(COMPANIES));
    setError(null);
    setFromCache(false);
    setCacheAge(null);

    fetch('/api/jobs/stream')
      .then((res) => {
        if (!res.ok || !res.body) throw new Error('Stream unavailable');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const pump = () =>
          reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();

            parts.forEach((part) => {
              const line = part.trim();
              if (!line.startsWith('data:')) return;
              try {
                const payload = JSON.parse(line.slice(5).trim());
                const { company: c, data, cached, cacheAge: age } = payload;
                setAllJobs((prev) => ({ ...prev, [c]: data }));
                setLoadingCompanies((prev) => {
                  const next = new Set(prev);
                  next.delete(c);
                  return next;
                });
                if (cached) { setFromCache(true); setCacheAge(age); }
              } catch (e) {
                console.warn('Failed to parse SSE chunk:', e);
              }
            });
            return pump();
          });

        return pump();
      })
      .catch((err) => {
        setError(err.message);
        setLoadingCompanies(new Set());
      });
  };

  const isAllDone = loadingCompanies.size === 0;
  const completedCount = COMPANIES.length - loadingCompanies.size;
  const isCurrentCompanyLoading = !showBookmarks && loadingCompanies.has(company);
  const totalJobs = Object.values(allJobs).reduce((s, j) => s + j.length, 0);

  // Bookmarked jobs flattened across all companies
  const bookmarkedJobs = Object.values(allJobs)
    .flat()
    .filter((j) => bookmarks[j.id]);

  const sortedJobs = showBookmarks ? bookmarkedJobs : (allJobs[company] || []);

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-white/30 font-sans">

      <div className="starfield-sm" />
      <div className="starfield-md" />
      <div className="starfield-lg" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 text-shadow-glow">
            Career Radar
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Discover top opportunities across the tech industry. Updated in real-time right from the company careers pages.
          </p>

          {isMounted && totalJobs > 0 && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="text-sm text-zinc-500">
                Found <span className="text-white font-semibold">{totalJobs} jobs</span> across{' '}
                <span className="text-white font-semibold">{completedCount} companies</span>
                {!isAllDone && <span className="text-amber-400"> · still scanning...</span>}
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
        {isMounted && !isAllDone && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Scanning all companies in parallel...</span>
              <span>{completedCount} / {COMPANIES.length} done</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${(completedCount / COMPANIES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls and Content - Guarded by isMounted to prevent hydration mismatch */}
        {isMounted && (
          <>
            {/* Controls row */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg gap-4">

              {/* Company tabs */}
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <span className="text-gray-400 font-medium whitespace-nowrap shrink-0 ml-2">Company:</span>

                {COMPANIES.map((id) => {
                  const isScanning = loadingCompanies.has(id);
                  const count = (allJobs[id] || []).length;
                  return (
                    <button
                      key={id}
                      onClick={() => { setCompany(id); setShowBookmarks(false); }}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        !showBookmarks && company === id
                          ? 'bg-white text-black shadow-lg shadow-white/20'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {COMPANY_LABELS[id]}
                      {!isScanning && count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${!showBookmarks && company === id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                          {count}
                        </span>
                      )}
                      {isScanning && (
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Bookmarks tab */}
                <button
                  onClick={() => setShowBookmarks(true)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    showBookmarks
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill={showBookmarks ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved
                  {bookmarkedJobs.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showBookmarks ? 'bg-black/20 text-black' : 'bg-amber-400/20 text-amber-400'}`}>
                      {bookmarkedJobs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Right side: metadata */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-sm text-zinc-400 font-medium whitespace-nowrap hidden md:block">
                  Location: <span className="text-white">India</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative min-h-[400px]">

              {error && (
                <div className="text-center p-12 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <span className="text-4xl block mb-4">⚠️</span>
                  <p className="text-xl text-red-400 font-medium">{error}</p>
                  <button onClick={startStreaming} className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg transition-colors border border-red-500/30">
                    Try Again
                  </button>
                </div>
              )}

              {isCurrentCompanyLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                  <p className="text-zinc-400 font-medium animate-pulse">Scraping {COMPANY_LABELS[company]}...</p>
                  <p className="text-zinc-600 text-sm">{completedCount} of {COMPANIES.length} companies ready</p>
                </div>
              )}

              {!isCurrentCompanyLoading && !error && sortedJobs.length === 0 && (
                <div className="text-center p-12 text-gray-400">
                  <span className="text-4xl block mb-4">{showBookmarks ? '🔖' : '🔍'}</span>
                  <p className="text-lg">
                    {showBookmarks
                      ? 'No saved jobs yet. Click the bookmark icon on any job card to save it.'
                      : `No job listings found for ${COMPANY_LABELS[company]}.`}
                  </p>
                </div>
              )}

              {!isCurrentCompanyLoading && !error && sortedJobs.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-600 mb-4">
                    Showing {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
                    {showBookmarks ? ' saved' : ` at ${COMPANY_LABELS[company]}`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {sortedJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}
