'use client';

import React, { useCallback } from 'react';
import { Users, Check, Trash2, Calendar, Loader2 } from 'lucide-react';

const CRM_KEY = 'career-radar-crm';

function getCRMContacts() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(CRM_KEY) || '{}'); } catch { return {}; }
}

/** Shows alternative recruiter suggestions returned by the auto-finder */
function RecruiterSuggestions({ suggestions, activeContactName, onSelect }) {
  if (suggestions.length <= 1) return null;
  return (
    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
      <span className="block text-[9px] uppercase font-bold text-amber-400 mb-1">
        Alternative Recruiters found:
      </span>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((rec, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(rec)}
            className={`w-full flex items-start text-left gap-2 p-1.5 rounded hover:bg-white/10 border transition-all text-xs ${
              activeContactName === rec.name
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-transparent'
            }`}
          >
            <span className="text-amber-400">👤</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white leading-tight truncate">{rec.name}</p>
              <p className="text-[10px] text-zinc-400 leading-tight truncate">{rec.role}</p>
            </div>
            <span className="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
              Use
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Expandable CRM panel that lives inside a JobCard.
 * Manages the form state for linking/editing a recruiter contact.
 */
export default function CRMPanel({
  job,
  hasContact,
  isSearchingRecruiters,
  suggestedRecruiters,
  // Form state (controlled by JobCard)
  contactName,      setContactName,
  contactRole,      setContactRole,
  contactEmail,     setContactEmail,
  contactLinkedin,  setContactLinkedin,
  contactStatus,    setContactStatus,
  contactNotes,     setContactNotes,
  nextFollowUp,     setNextFollowUp,
  checklist,        setChecklist,
  // Callbacks
  onSave,
  onDelete,
  onClose,
}) {
  const toggleChecklistItem = useCallback(
    (item) => setChecklist(prev => ({ ...prev, [item]: !prev[item] })),
    [setChecklist]
  );

  const handleSelectSuggestion = useCallback((rec) => {
    setContactName(rec.name);
    setContactLinkedin(rec.linkedinUrl);
    setContactNotes(`Title: ${rec.role}`);
    setContactRole('Recruiter');
  }, [setContactName, setContactLinkedin, setContactNotes, setContactRole]);

  return (
    <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-white/5 flex flex-col gap-2.5 text-left text-xs z-20">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
        <span className="font-bold text-white text-xs">
          {hasContact ? 'Edit Contact CRM' : 'Link Contact CRM'}
        </span>
        {hasContact && (
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-all"
            title="Remove contact"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loading / suggestions */}
      {isSearchingRecruiters && (
        <div className="flex items-center gap-1.5 text-zinc-400 animate-pulse text-[10px]">
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          Auto-finding recruiter...
        </div>
      )}

      <RecruiterSuggestions
        suggestions={suggestedRecruiters}
        activeContactName={contactName}
        onSelect={handleSelectSuggestion}
      />

      {/* Form Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Name</label>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Role</label>
          <select
            value={contactRole}
            onChange={e => setContactRole(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-zinc-300 focus:outline-none focus:border-amber-500/40 text-xs"
          >
            <option value="Recruiter">Recruiter</option>
            <option value="Hiring Manager">Hiring Manager</option>
            <option value="Referrer">Referrer</option>
            <option value="Interviewer">Interviewer</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">LinkedIn URL</label>
          <input
            type="text"
            value={contactLinkedin}
            onChange={e => setContactLinkedin(e.target.value)}
            placeholder="linkedin.com/in/..."
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Status</label>
          <select
            value={contactStatus}
            onChange={e => setContactStatus(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-zinc-300 focus:outline-none focus:border-amber-500/40 text-xs"
          >
            <option value="No Response">No Response</option>
            <option value="Connected">Connected</option>
            <option value="In Discussion">In Discussion</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Ghosted">Ghosted</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-500" /> Next Follow-Up
          </label>
          <input
            type="date"
            value={nextFollowUp}
            onChange={e => setNextFollowUp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white focus:outline-none focus:border-amber-500/40 text-xs"
          />
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-[10px] text-zinc-500 mb-1">Checklist</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { key: 'connected',       label: 'LinkedIn Connected' },
            { key: 'pitchSent',       label: 'Pitch Sent' },
            { key: 'appliedFollowUp', label: 'Applied Follow-Up' },
            { key: 'thankYouSent',   label: 'Thank You Sent' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={() => toggleChecklistItem(key)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-zinc-500 mb-0.5">Interaction Notes</label>
        <textarea
          value={contactNotes}
          onChange={e => setContactNotes(e.target.value)}
          placeholder="e.g. Recruiter preferred email, referral requested."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end mt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-3 py-1 rounded bg-amber-400 text-black hover:bg-amber-300 font-bold flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
