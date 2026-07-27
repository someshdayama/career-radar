'use client';

import React from 'react';

function formatPostedDate(postedDate) {
  if (!postedDate) return null;

  const ts = Date.parse(postedDate);
  if (!isNaN(ts)) {
    const now = Date.now();
    const diffMs = now - ts;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 30) return `Posted ${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Posted ${diffMonths}mo ago`;
    return `Posted ${Math.floor(diffMonths / 12)}y ago`;
  }

  const lower = postedDate.toLowerCase();
  if (lower.includes('ago') || lower.includes('today') || lower.includes('yesterday')) {
    return `Posted ${postedDate}`;
  }

  return postedDate;
}

function isJobNew(postedDate) {
  if (!postedDate) return false;
  const ts = Date.parse(postedDate);
  if (isNaN(ts)) return false;
  return (Date.now() - ts) < 7 * 24 * 60 * 60 * 1000;
}

export default function JobCard({ job, isNew = false, onSelect, isSaved = false, onToggleSave, jobStatus }) {
  const computedIsNew = job.postedDate ? isJobNew(job.postedDate) : isNew;
  const dateLabel = formatPostedDate(job.postedDate);

  return (
    <div
      className="group relative rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-4 sm:p-4 shadow-xl transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900/90 flex flex-col justify-between h-full cursor-pointer"
      onClick={() => onSelect?.(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(job); } }}
      aria-label={`View details for ${job.title} at ${job.company}`}
    >
      {/* Card Header: Badges & Bookmark */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          {computedIsNew && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              NEW
            </span>
          )}

          {jobStatus === 'applied' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Applied</span>
          )}
          {jobStatus === 'interviewing' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">Interviewing</span>
          )}
          {jobStatus === 'rejected' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">Rejected</span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {dateLabel && (
            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
              {dateLabel}
            </span>
          )}
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full transition-colors text-xs hover:bg-zinc-800"
            onClick={(e) => { e.stopPropagation(); onToggleSave?.(job.id); }}
            title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
            style={{ color: isSaved ? '#fbbf24' : '#71717a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isSaved ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-col flex-1">
        {/* Title & Company */}
        <div className="mb-2 min-h-[2.75rem]">
          <h3 className="text-sm font-bold text-white mb-0.5 leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors">
            {job.title}
          </h3>
          <p className="text-xs font-semibold text-zinc-400 truncate">
            {job.company}
          </p>
        </div>

        {/* Location Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 bg-zinc-900 text-zinc-300 text-[11px] font-medium px-2.5 py-1 rounded-md border border-zinc-800">
            <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[200px]">{job.location}</span>
          </span>
        </div>

        {/* Snippet */}
        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
          {job.descriptionSnippet}
        </p>
      </div>

      {/* Actions Footer */}
      <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center mt-auto">
        <span className="text-[11px] text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">
          Details ↗
        </span>
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold py-1.5 px-3.5 rounded-lg transition-colors text-xs"
        >
          <span>Apply Now</span>
          <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
