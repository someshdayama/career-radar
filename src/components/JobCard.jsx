'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, FileText, Loader2, Bookmark } from 'lucide-react';
import CRMPanel from './CRMPanel';

const STORAGE_KEY = 'career-radar-bookmarks';
const RESUME_KEY  = 'career-radar-resumes';
const CRM_KEY     = 'career-radar-crm';

// ── helpers ──────────────────────────────────────────────────────────────────
function getBookmarks() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function getCRMContacts() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(CRM_KEY) || '{}'); } catch { return {}; }
}
function getDefaultFollowUp() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().split('T')[0];
}
const DEFAULT_CHECKLIST = { connected: false, pitchSent: false, appliedFollowUp: false, thankYouSent: false };

// ── component ─────────────────────────────────────────────────────────────────
export default function JobCard({ job, isNew = false }) {
  const [bookmarked,    setBookmarked]   = useState(false);
  const [copied,        setCopied]       = useState(false);
  const [resumeBuilt,   setResumeBuilt]  = useState(false);
  const [showCrmPanel,  setShowCrmPanel] = useState(false);

  // CRM contact state
  const [hasContact,       setHasContact]       = useState(false);
  const [contactName,      setContactName]      = useState('');
  const [contactRole,      setContactRole]      = useState('Recruiter');
  const [contactEmail,     setContactEmail]     = useState('');
  const [contactLinkedin,  setContactLinkedin]  = useState('');
  const [contactStatus,    setContactStatus]    = useState('No Response');
  const [contactNotes,     setContactNotes]     = useState('');
  const [nextFollowUp,     setNextFollowUp]     = useState(getDefaultFollowUp);
  const [checklist,        setChecklist]        = useState(DEFAULT_CHECKLIST);

  // Recruiter auto-finder
  const [suggestedRecruiters,   setSuggestedRecruiters]   = useState([]);
  const [isSearchingRecruiters, setIsSearchingRecruiters] = useState(false);
  const hasSearchedRef = useRef(false);

  // Load persisted data once per job.id change
  useEffect(() => {
    setBookmarked(!!getBookmarks()[job.id]);

    const resumes = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
    setResumeBuilt(!!resumes[job.id]);

    const contact = getCRMContacts()[job.id];
    if (contact) {
      setHasContact(true);
      setContactName(contact.contactName || '');
      setContactRole(contact.contactRole || 'Recruiter');
      setContactEmail(contact.email || '');
      setContactLinkedin(contact.linkedinUrl || '');
      setContactStatus(contact.status || 'No Response');
      setContactNotes(contact.notes || '');
      setNextFollowUp(contact.nextFollowUp || getDefaultFollowUp());
      setChecklist(contact.checklist || DEFAULT_CHECKLIST);
      hasSearchedRef.current = true;
    } else {
      setHasContact(false);
      setContactName('');
      setContactRole('Recruiter');
      setContactEmail('');
      setContactLinkedin('');
      setContactStatus('No Response');
      setContactNotes('');
      setNextFollowUp(getDefaultFollowUp());
      setChecklist(DEFAULT_CHECKLIST);
      hasSearchedRef.current = false;
      setSuggestedRecruiters([]);
    }
  }, [job.id]);

  // Auto-find recruiter on first hover
  const triggerRecruiterSearch = useCallback(async () => {
    if (hasSearchedRef.current || isSearchingRecruiters || hasContact) return;
    hasSearchedRef.current = true;
    setIsSearchingRecruiters(true);
    try {
      const res  = await fetch(`/api/recruiters/search?company=${encodeURIComponent(job.company)}&location=${encodeURIComponent(job.location || 'India')}`);
      const data = await res.json();
      if (data.recruiters?.length) {
        setSuggestedRecruiters(data.recruiters);
        const best = data.recruiters[0];
        const followUp = getDefaultFollowUp();

        setContactName(best.name);
        setContactLinkedin(best.linkedinUrl);
        setContactNotes(`Title: ${best.role} (Auto-Discovered)`);
        setContactRole('Recruiter');
        setNextFollowUp(followUp);
        setHasContact(true);

        const contacts = getCRMContacts();
        contacts[job.id] = {
          id: job.id, jobId: job.id, company: job.company, jobTitle: job.title,
          contactName: best.name, contactRole: 'Recruiter', email: '',
          linkedinUrl: best.linkedinUrl, status: 'No Response',
          notes: `Title: ${best.role} (Auto-Linked)`, nextFollowUp: followUp,
          lastContacted: new Date().toISOString().split('T')[0],
          checklist: DEFAULT_CHECKLIST,
        };
        localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
      }
    } catch (e) {
      console.warn('Recruiter search failed:', e);
      hasSearchedRef.current = false;
    } finally {
      setIsSearchingRecruiters(false);
    }
  }, [job, hasContact, isSearchingRecruiters]);

  const handleBookmark = useCallback((e) => {
    e.preventDefault();
    const bookmarks = getBookmarks();
    if (bookmarks[job.id]) delete bookmarks[job.id];
    else bookmarks[job.id] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    const next = !!bookmarks[job.id];
    setBookmarked(next);
    // Notify parent page without polling
    window.dispatchEvent(new CustomEvent('bookmarkChanged'));
  }, [job.id]);

  const handleCopy = useCallback((e) => {
    e.preventDefault();
    navigator.clipboard?.writeText(job.applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [job.applyUrl]);

  const saveCRMContact = useCallback(() => {
    if (!contactName.trim()) { alert('Please enter a contact name.'); return; }
    const contacts = getCRMContacts();
    contacts[job.id] = {
      id: job.id, jobId: job.id, company: job.company, jobTitle: job.title,
      contactName, contactRole, email: contactEmail, linkedinUrl: contactLinkedin,
      status: contactStatus, notes: contactNotes, nextFollowUp,
      lastContacted: new Date().toISOString().split('T')[0],
      checklist,
    };
    localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
    setHasContact(true);
    setShowCrmPanel(false);
  }, [job, contactName, contactRole, contactEmail, contactLinkedin, contactStatus, contactNotes, nextFollowUp, checklist]);

  const deleteCRMContact = useCallback(() => {
    if (!confirm('Remove this contact?')) return;
    const contacts = getCRMContacts();
    delete contacts[job.id];
    localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
    setHasContact(false);
    setShowCrmPanel(false);
    hasSearchedRef.current = false;
    setContactName(''); setContactRole('Recruiter'); setContactEmail('');
    setContactLinkedin(''); setContactStatus('No Response'); setContactNotes('');
    setSuggestedRecruiters([]);
    setChecklist(DEFAULT_CHECKLIST);
  }, [job.id]);

  const handleBuildResume = useCallback(() => {
    const params = new URLSearchParams({
      jobTitle: job.title, company: job.company,
      location: job.location || '', description: job.descriptionSnippet || '',
    });
    const resumes = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
    resumes[job.id] = true;
    localStorage.setItem(RESUME_KEY, JSON.stringify(resumes));
    setResumeBuilt(true);
    
    const promptlyUrl = process.env.NEXT_PUBLIC_PROMPTLY_URL || 'https://resumebuilder-promptly.vercel.app';
    window.open(`${promptlyUrl}/?${params}`, '_blank');
  }, [job]);

  const hasBadge = isNew || resumeBuilt || hasContact || isSearchingRecruiters;

  return (
    <div
      onMouseEnter={triggerRecruiterSearch}
      className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-5 shadow-xl transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-white/5 hover:border-white/20 flex flex-col justify-between"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
        {isNew && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            NEW
          </span>
        )}
        {resumeBuilt && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            ✓ Resume Drafted
          </span>
        )}
        {hasContact && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            🤝 {contactName} ({contactRole})
          </span>
        )}
        {isSearchingRecruiters && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10 flex items-center gap-1 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" /> Finding Recruiter...
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
          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Save job'}
            className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
              bookmarked ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/10'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
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
      <div className="pt-3 border-t border-white/8 flex flex-col gap-2 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {/* Copy link */}
            <div className="relative">
              <button
                onClick={handleCopy}
                title="Copy link"
                className={`transition-colors p-1.5 rounded-lg ${
                  copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/10'
                }`}
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
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap border border-zinc-700">
                  Copied!
                </span>
              )}
            </div>

            {/* CRM toggle */}
            <button
              onClick={e => { e.preventDefault(); setShowCrmPanel(p => !p); }}
              title="Track recruiter networking"
              className={`p-1.5 rounded-lg transition-all ${
                showCrmPanel || hasContact
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

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

        {/* Build Resume */}
        <button
          onClick={handleBuildResume}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200"
        >
          <FileText className="w-3.5 h-3.5" />
          Build Tailored Resume
        </button>

        {/* CRM Panel */}
        {showCrmPanel && (
          <CRMPanel
            job={job}
            hasContact={hasContact}
            isSearchingRecruiters={isSearchingRecruiters}
            suggestedRecruiters={suggestedRecruiters}
            contactName={contactName}      setContactName={setContactName}
            contactRole={contactRole}      setContactRole={setContactRole}
            contactEmail={contactEmail}    setContactEmail={setContactEmail}
            contactLinkedin={contactLinkedin} setContactLinkedin={setContactLinkedin}
            contactStatus={contactStatus}  setContactStatus={setContactStatus}
            contactNotes={contactNotes}    setContactNotes={setContactNotes}
            nextFollowUp={nextFollowUp}    setNextFollowUp={setNextFollowUp}
            checklist={checklist}          setChecklist={setChecklist}
            onSave={saveCRMContact}
            onDelete={deleteCRMContact}
            onClose={() => setShowCrmPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
