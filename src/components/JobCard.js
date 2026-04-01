'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'career-radar-bookmarks';

function getBookmarks() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function toggleBookmark(jobId) {
  const bookmarks = getBookmarks();
  if (bookmarks[jobId]) { delete bookmarks[jobId]; }
  else { bookmarks[jobId] = true; }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  return !!bookmarks[jobId];
}

export default function JobCard({ job }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(!!getBookmarks()[job.id]);
  }, [job.id]);

  const handleBookmark = (e) => {
    e.preventDefault();
    const next = toggleBookmark(job.id);
    setBookmarked(next);
  };

  return (
    <div className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-white/5">

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-bold text-white mb-1 leading-snug">{job.title}</h3>
          <p className="text-sm font-medium text-zinc-400">{job.company}</p>
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Save job'}
          className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
            bookmarked
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Location badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
          <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-6 line-clamp-3">{job.descriptionSnippet}</p>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
        {/* Copy link */}
        <button
          onClick={() => navigator.clipboard?.writeText(job.applyUrl)}
          title="Copy link"
          className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-2 px-5 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/20 text-sm"
        >
          <span>Apply Now</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
