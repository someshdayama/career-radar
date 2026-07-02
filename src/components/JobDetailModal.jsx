'use client';

import React, { useEffect, useCallback, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'No status', color: 'rgba(255,255,255,0.1)', text: '#9ca3af' },
  { value: 'saved', label: '🔖 Saved', color: 'rgba(99,179,237,0.15)', text: '#63b3ed' },
  { value: 'applied', label: '✅ Applied', color: 'rgba(52,211,153,0.15)', text: '#34d399' },
  { value: 'interviewing', label: '🎯 Interviewing', color: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  { value: 'rejected', label: '✕ Rejected', color: 'rgba(244,63,94,0.15)', text: '#f43f5e' },
];

/**
 * Modal / Slide-over panel showing full job details.
 * Opens when a JobCard is clicked. Supports Escape to close.
 */
export default function JobDetailModal({ job, onClose, onApply, jobStatuses, onStatusChange }) {
  const [copied, setCopied] = useState(false);
  const currentStatus = job ? (jobStatuses?.[job.id] || '') : '';

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(job?.applyUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!job) return null;

  const statusMeta = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Job details: ${job.title}`}
      >
        <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl animate-fadeIn">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all text-sm"
            aria-label="Close modal"
          >
            ✕
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Company badge */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                {job.company}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-4 pr-8 leading-snug">
              {job.title}
            </h2>

            {/* Location */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 bg-white/8 text-zinc-300 text-sm px-3 py-1.5 rounded-full border border-white/10">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
            </div>

            {/* Status Tracker */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Application Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onStatusChange?.(job.id, opt.value)}
                    style={{
                      backgroundColor: currentStatus === opt.value ? opt.color : 'rgba(255,255,255,0.04)',
                      color: currentStatus === opt.value ? opt.text : '#6b7280',
                      border: `1px solid ${currentStatus === opt.value ? opt.text + '55' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label || 'None'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">About this role</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {job.descriptionSnippet || 'No description available for this position.'}
              </p>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 mb-6 text-xs text-zinc-500">
              {job.postedDate && (
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  🕐 {job.postedDate}
                </span>
              )}
              <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                🏢 {job.company}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-2.5 px-6 rounded-xl transition-all duration-300 text-sm"
              >
                <span>Apply Now</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-zinc-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 text-sm border border-white/10"
                title="Copy job link"
              >
                {copied ? (
                  <>✓ Copied</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Link
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-zinc-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 text-sm border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}