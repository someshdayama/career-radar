'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Link2, Plus, Check, Trash2, Calendar, FileText, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'career-radar-bookmarks';
const RESUME_KEY = 'career-radar-resumes';
const CRM_KEY = 'career-radar-crm';

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

function getCRMContacts() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(CRM_KEY) || '{}'); } catch { return {}; }
}

export default function JobCard({ job, isNew = false }) {
  const [bookmarked, setBookmarked]     = useState(false);
  const [copied, setCopied]             = useState(false);
  const [resumeBuilt, setResumeBuilt]   = useState(false);
  
  // CRM States
  const [showCrmPanel, setShowCrmPanel] = useState(false);
  const [hasContact, setHasContact]     = useState(false);
  const [contactName, setContactName]   = useState('');
  const [contactRole, setContactRole]   = useState('Recruiter');
  const [contactEmail, setContactEmail] = useState('');
  const [contactLinkedin, setContactLinkedin] = useState('');
  const [contactStatus, setContactStatus] = useState('No Response');
  const [contactNotes, setContactNotes]   = useState('');
  const [nextFollowUp, setNextFollowUp]   = useState('');
  const [checklist, setChecklist]         = useState({
    connected: false,
    pitchSent: false,
    appliedFollowUp: false,
    thankYouSent: false,
  });

  // Automated Finder States
  const [suggestedRecruiters, setSuggestedRecruiters] = useState([]);
  const [isSearchingRecruiters, setIsSearchingRecruiters] = useState(false);
  const hasSearchedRef = useRef(false);

  useEffect(() => {
    // Load Bookmarks & Resumes
    setBookmarked(!!getBookmarks()[job.id]);
    const resumes = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
    setResumeBuilt(!!resumes[job.id]);

    // Load CRM Contact
    const contacts = getCRMContacts();
    const contact = contacts[job.id];
    if (contact) {
      setHasContact(true);
      setContactName(contact.contactName || '');
      setContactRole(contact.contactRole || 'Recruiter');
      setContactEmail(contact.email || '');
      setContactLinkedin(contact.linkedinUrl || '');
      setContactStatus(contact.status || 'No Response');
      setContactNotes(contact.notes || '');
      setNextFollowUp(contact.nextFollowUp || '');
      setChecklist(contact.checklist || {
        connected: false,
        pitchSent: false,
        appliedFollowUp: false,
        thankYouSent: false,
      });
      hasSearchedRef.current = true;
    } else {
      setHasContact(false);
      // Reset to defaults
      setContactName('');
      setContactRole('Recruiter');
      setContactEmail('');
      setContactLinkedin('');
      setContactStatus('No Response');
      setContactNotes('');
      hasSearchedRef.current = false;
      setSuggestedRecruiters([]);
      
      // Default follow-up: 5 days from today
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      setNextFollowUp(futureDate.toISOString().split('T')[0]);
      
      setChecklist({
        connected: false,
        pitchSent: false,
        appliedFollowUp: false,
        thankYouSent: false,
      });
    }
  }, [job.id]);

  const triggerRecruiterSearch = async () => {
    if (hasSearchedRef.current || isSearchingRecruiters || hasContact) return;
    hasSearchedRef.current = true;
    setIsSearchingRecruiters(true);
    try {
      const res = await fetch(`/api/recruiters/search?company=${encodeURIComponent(job.company)}&location=${encodeURIComponent(job.location || 'India')}`);
      const data = await res.json();
      
      if (data.recruiters && data.recruiters.length > 0) {
        setSuggestedRecruiters(data.recruiters);
        
        // Take the highest scored recruiter (first one)
        const bestMatch = data.recruiters[0];
        
        // Populate local states
        setContactName(bestMatch.name);
        setContactLinkedin(bestMatch.linkedinUrl);
        setContactNotes(`Title: ${bestMatch.role} (Auto-Discovered)`);
        setContactRole('Recruiter');
        setHasContact(true);

        // Calculate 5-day follow up
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const followUpStr = futureDate.toISOString().split('T')[0];
        setNextFollowUp(followUpStr);

        // AUTOMATICALLY SAVE directly to CRM database!
        const contacts = getCRMContacts();
        contacts[job.id] = {
          id: job.id,
          jobId: job.id,
          company: job.company,
          jobTitle: job.title,
          contactName: bestMatch.name,
          contactRole: 'Recruiter',
          email: '',
          linkedinUrl: bestMatch.linkedinUrl,
          status: 'No Response',
          notes: `Title: ${bestMatch.role} (Auto-Linked)`,
          nextFollowUp: followUpStr,
          lastContacted: new Date().toISOString().split('T')[0],
          checklist: {
            connected: false,
            pitchSent: false,
            appliedFollowUp: false,
            thankYouSent: false,
          },
        };
        localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
      }
    } catch (e) {
      console.warn('Recruiter automated search failed:', e);
      // Reset ref so we can retry on next hover if it failed
      hasSearchedRef.current = false;
    } finally {
      setIsSearchingRecruiters(false);
    }
  };

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

  const saveCRMContact = () => {
    if (!contactName.trim()) {
      alert('Please enter a contact name.');
      return;
    }
    const contacts = getCRMContacts();
    const newContact = {
      id: job.id,
      jobId: job.id,
      company: job.company,
      jobTitle: job.title,
      contactName,
      contactRole,
      email: contactEmail,
      linkedinUrl: contactLinkedin,
      status: contactStatus,
      notes: contactNotes,
      nextFollowUp,
      lastContacted: new Date().toISOString().split('T')[0],
      checklist,
    };
    contacts[job.id] = newContact;
    localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
    setHasContact(true);
    setShowCrmPanel(false);
  };

  const deleteCRMContact = () => {
    if (confirm('Are you sure you want to remove this contact?')) {
      const contacts = getCRMContacts();
      delete contacts[job.id];
      localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
      setHasContact(false);
      setShowCrmPanel(false);
      hasSearchedRef.current = false;
      
      // Reset states
      setContactName('');
      setContactRole('Recruiter');
      setContactEmail('');
      setContactLinkedin('');
      setContactStatus('No Response');
      setContactNotes('');
      setSuggestedRecruiters([]);
      setChecklist({
        connected: false,
        pitchSent: false,
        appliedFollowUp: false,
        thankYouSent: false,
      });
    }
  };

  const toggleChecklistItem = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div 
      onMouseEnter={triggerRecruiterSearch}
      className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-5 shadow-xl transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-white/5 hover:border-white/20 flex flex-col justify-between"
    >
      
      {/* Badges container */}
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
        <div className={`flex justify-between items-start mb-3 ${(isNew || resumeBuilt || hasContact || isSearchingRecruiters) ? 'mt-6' : ''}`}>
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
      </div>

      <div className="pt-3 border-t border-white/8 flex flex-col gap-2 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {/* Copy Link */}
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
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap border border-zinc-700">
                  Copied!
                </span>
              )}
            </div>

            {/* Network / CRM Toggle Button */}
            <button
              onClick={(e) => { e.preventDefault(); setShowCrmPanel(!showCrmPanel); }}
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

        {/* Build Resume button — launches Resume page with this job pre-filled */}
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

            // Open internal /resume route in new tab
            window.open(`/resume?${params.toString()}`, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200"
        >
          <FileText className="w-3.5 h-3.5" />
          Build Tailored Resume
        </button>

        {/* CRM Expandable Recruiter Panel */}
        {showCrmPanel && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-white/5 flex flex-col gap-2.5 text-left text-xs animate-fadeIn z-20">
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="font-bold text-white text-xs">{hasContact ? 'Edit Contact CRM' : 'Link Contact CRM'}</span>
              {hasContact && (
                <button
                  onClick={deleteCRMContact}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-all"
                  title="Remove contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* AI Automated Recruiter Search Suggestions */}
            {suggestedRecruiters.length > 1 && (
              <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
                <span className="block text-[9px] uppercase font-bold text-amber-400 mb-1">Alternative Recruiters found:</span>
                <div className="flex flex-col gap-1.5">
                  {suggestedRecruiters.map((rec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setContactName(rec.name);
                        setContactLinkedin(rec.linkedinUrl);
                        setContactNotes(`Title: ${rec.role}`);
                        setContactRole('Recruiter');
                      }}
                      className={`w-full flex items-start text-left gap-2 p-1.5 rounded hover:bg-white/10 border transition-all text-xs ${
                        contactName === rec.name ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent'
                      }`}
                    >
                      <span className="text-amber-400">👤</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white leading-tight truncate">{rec.name}</p>
                        <p className="text-[10px] text-zinc-400 leading-tight truncate">{rec.role}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">Use</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">Role</label>
                <select
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
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
                  onChange={(e) => setContactLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
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
                  onChange={(e) => setContactStatus(e.target.value)}
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
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Checklist</label>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={checklist.connected}
                    onChange={() => toggleChecklistItem('connected')}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>LinkedIn Connected</span>
                </label>
                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={checklist.pitchSent}
                    onChange={() => toggleChecklistItem('pitchSent')}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Pitch Sent</span>
                </label>
                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={checklist.appliedFollowUp}
                    onChange={() => toggleChecklistItem('appliedFollowUp')}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Applied Follow-Up</span>
                </label>
                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={checklist.thankYouSent}
                    onChange={() => toggleChecklistItem('thankYouSent')}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Thank You Sent</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] text-zinc-500 mb-0.5">Interaction Notes</label>
              <textarea
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="e.g. Recruiter preferred email, referral requested."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500/40 text-xs resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowCrmPanel(false)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCRMContact}
                className="px-3 py-1 rounded bg-amber-400 text-black hover:bg-amber-300 font-bold flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
