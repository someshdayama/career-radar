'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'career-radar-bookmarks';
const RESUME_KEY = 'career-radar-resumes';
const PROMPTLY_URL = process.env.NEXT_PUBLIC_PROMPTLY_URL || 'http://localhost:3001';

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

export default function JobCard({ job, isNew = false }) {
  const [bookmarked, setBookmarked]     = useState(false);
  const [copied, setCopied]             = useState(false);
  const [resumeBuilt, setResumeBuilt]   = useState(false);

  useEffect(() => {
    setBookmarked(!!getBookmarks()[job.id]);
    const resumes = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
    setResumeBuilt(!!resumes[job.id]);
  }, [job.id]);

  const handleBookmark = (e) => {
    e.preventDefault();
    const next = toggleBookmark(job.id);
    setBookmarked(next);
  };

  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText(job.applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-5 shadow-xl transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-white/5 hover:border-white/20 flex flex-col">

      {/* Badges container */}
      <div className="absolute top-4 left-4 flex gap-2">
        {isNew && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 badge-new">
            NEW
          </span>
        )}
        {resumeBuilt && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            ✓ Resume Drafted
          </span>
        )}
      </div>

      <div className={`flex justify-between items-start mb-3 ${(isNew || resumeBuilt) ? 'mt-4' : ''}`}>
        <div className="flex-1 pr-2">
          <h3 className="text-base font-bold text-white mb-0.5 leading-snug line-clamp-2">{job.title}</h3>
          <p className="text-xs font-medium text-zinc-500">{job.company}</p>
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
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 bg-white/8 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full border border-white/10">
          <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>
      </div>

      <p className="text-zinc-500 text-xs mb-4 line-clamp-3 flex-1">{job.descriptionSnippet}</p>

      <div className="pt-3 border-t border-white/8 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Copy link — with tooltip */}
          <div className="relative">
            <button
              onClick={handleCopy}
              title="Copy link"
              className={`transition-colors p-1.5 rounded-lg ${copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/10'}`}
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap border border-zinc-700 toast-pop">
                Copied!
              </span>
            )}
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-1.5 px-4 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/10 text-xs"
          >
            <span>Apply Now</span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Build Resume button — launches Promptly with this job pre-filled */}
        <button
          onClick={() => {
            const params = new URLSearchParams({
              jobTitle: job.title,
              company: job.company,
              location: job.location || '',
              description: job.descriptionSnippet || '',
            });
            
            // Mark as built in local storage
            const resumes = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
            resumes[job.id] = true;
            localStorage.setItem(RESUME_KEY, JSON.stringify(resumes));
            setResumeBuilt(true);

            window.open(`${PROMPTLY_URL}?${params.toString()}`, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Build Tailored Resume
        </button>
      </div>
    </div>
  );
}
