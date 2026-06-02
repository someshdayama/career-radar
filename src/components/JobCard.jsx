'use client';

import React from 'react';

/**
 * Formats a posted date string into a human-readable relative time.
 * Accepts ISO strings, plain date strings, or relative text like "Posted 3 days ago".
 */
function formatPostedDate(postedDate) {
  if (!postedDate) return null;

  // If it's an ISO date string, compute relative time
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

  // If it's already a human-readable string like "3 days ago"
  const lower = postedDate.toLowerCase();
  if (lower.includes('ago') || lower.includes('today') || lower.includes('yesterday')) {
    return `Posted ${postedDate}`;
  }

  // Fallback: show the raw text
  return postedDate;
}

/**
 * Returns true if the job was posted within the last 7 days.
 */
function isJobNew(postedDate) {
  if (!postedDate) return false;
  const ts = Date.parse(postedDate);
  if (isNaN(ts)) return false;
  return (Date.now() - ts) < 7 * 24 * 60 * 60 * 1000;
}

// ── component ─────────────────────────────────────────────────────────────────
export default function JobCard({ job, isNew = false, onSelect }) {
  // If the job has a postedDate, compute real freshness
  const computedIsNew = job.postedDate ? isJobNew(job.postedDate) : isNew;
  const dateLabel = formatPostedDate(job.postedDate);

  return (
    <div
      className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-5 shadow-xl transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-white/5 hover:border-white/20 flex flex-col justify-between cursor-pointer"
      onClick={() => onSelect?.(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(job); } }}
      aria-label={`View details for ${job.title} at ${job.company}`}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
        {computedIsNew && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 badge-new">
            NEW
          </span>
        )}
      </div>

      {/* Posted date badge on right */}
      {dateLabel && (
        <div className="absolute top-4 right-4 z-10">
          <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            {dateLabel}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1">
        {/* Title row */}
        <div className={`flex justify-between items-start mb-3 ${computedIsNew ? 'mt-6' : dateLabel ? 'mt-6' : ''}`}>
          <div className="flex-1 pr-2">
            <h3 className="text-base font-bold text-white mb-0.5 leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors">{job.title}</h3>
            <p className="text-xs font-medium text-zinc-500">{job.company}</p>
          </div>
        </div>

        {/* Location */}
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
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-white/8 flex justify-between items-center mt-auto">
        <span className="text-[10px] text-zinc-600">Click to view details</span>
        {/* Apply */}
        <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-1.5 px-4 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/10 text-xs"
          >
            <span>Apply Now</span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
      </div>
    </div>
  );
}
