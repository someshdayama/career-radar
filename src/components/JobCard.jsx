'use client';

import React from 'react';

// ── component ─────────────────────────────────────────────────────────────────
export default function JobCard({ job, isNew = false }) {



  const hasBadge = isNew;

  return (
    <div
      className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-5 shadow-xl transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-white/5 hover:border-white/20 flex flex-col justify-between"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
        {isNew && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            NEW
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1">
        {/* Title row */}
        <div className={`flex justify-between items-start mb-3 ${hasBadge ? 'mt-6' : ''}`}>
          <div className="flex-1 pr-2">
            <h3 className="text-base font-bold text-white mb-0.5 leading-snug line-clamp-2">{job.title}</h3>
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
      <div className="pt-3 border-t border-white/8 flex justify-end mt-auto">
        {/* Apply */}
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
    </div>
  );
}
