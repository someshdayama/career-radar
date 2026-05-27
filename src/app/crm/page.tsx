'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Calendar, Check, Trash2, Edit2, Mail, Linkedin, Clock, ArrowLeft, CheckCircle2, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

const CRM_KEY = 'career-radar-crm';

interface CRMChecklist {
  connected: boolean;
  pitchSent: boolean;
  appliedFollowUp: boolean;
  thankYouSent: boolean;
}

interface CRMContact {
  id: string;
  jobId?: string;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  email: string;
  linkedinUrl: string;
  status: string;
  notes: string;
  nextFollowUp: string;
  lastContacted: string;
  checklist: CRMChecklist;
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals / Modifying States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
  
  // Form fields for adding/editing
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Recruiter');
  const [formCompany, setFormCompany] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formStatus, setFormStatus] = useState('No Response');
  const [formNotes, setFormNotes] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formChecklist, setFormChecklist] = useState<CRMChecklist>({
    connected: false,
    pitchSent: false,
    appliedFollowUp: false,
    thankYouSent: false,
  });

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    if (typeof window === 'undefined') return;
    try {
      const data = JSON.parse(localStorage.getItem(CRM_KEY) || '{}');
      setContacts(Object.values(data));
    } catch (e) {
      console.error('Failed to load CRM contacts:', e);
    }
  };

  const saveContactsObj = (contactsObj: Record<string, CRMContact>) => {
    localStorage.setItem(CRM_KEY, JSON.stringify(contactsObj));
    loadContacts();
  };

  const openAddModal = () => {
    setFormName('');
    setFormRole('Recruiter');
    setFormCompany('');
    setFormJobTitle('');
    setFormEmail('');
    setFormLinkedin('');
    setFormStatus('No Response');
    setFormNotes('');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    setFormFollowUp(futureDate.toISOString().split('T')[0]);
    
    setFormChecklist({
      connected: false,
      pitchSent: false,
      appliedFollowUp: false,
      thankYouSent: false,
    });
    setEditingContact(null);
    setShowAddModal(true);
  };

  const openEditModal = (contact: CRMContact) => {
    setEditingContact(contact);
    setFormName(contact.contactName || '');
    setFormRole(contact.contactRole || 'Recruiter');
    setFormCompany(contact.company || '');
    setFormJobTitle(contact.jobTitle || '');
    setFormEmail(contact.email || '');
    setFormLinkedin(contact.linkedinUrl || '');
    setFormStatus(contact.status || 'No Response');
    setFormNotes(contact.notes || '');
    setFormFollowUp(contact.nextFollowUp || '');
    setFormChecklist(contact.checklist || {
      connected: false,
      pitchSent: false,
      appliedFollowUp: false,
      thankYouSent: false,
    });
    setShowAddModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCompany.trim()) {
      alert('Please fill in Name and Company.');
      return;
    }

    const currentContacts: Record<string, CRMContact> = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CRM_KEY) || '{}') : {};
    const id = editingContact ? editingContact.id : `standalone-${Date.now()}`;
    
    const updatedContact: CRMContact = {
      id,
      jobId: editingContact ? editingContact.jobId : undefined,
      company: formCompany,
      jobTitle: formJobTitle || 'General Application',
      contactName: formName,
      contactRole: formRole,
      email: formEmail,
      linkedinUrl: formLinkedin,
      status: formStatus,
      notes: formNotes,
      nextFollowUp: formFollowUp,
      lastContacted: new Date().toISOString().split('T')[0],
      checklist: formChecklist,
    };

    currentContacts[id] = updatedContact;
    saveContactsObj(currentContacts);
    setShowAddModal(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      const currentContacts: Record<string, CRMContact> = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CRM_KEY) || '{}') : {};
      delete currentContacts[id];
      saveContactsObj(currentContacts);
      setShowAddModal(false);
      setEditingContact(null);
    }
  };

  const toggleChecklistInList = (contact: CRMContact, item: keyof CRMChecklist) => {
    const currentContacts: Record<string, CRMContact> = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CRM_KEY) || '{}') : {};
    const updated: CRMContact = {
      ...contact,
      checklist: {
        ...contact.checklist,
        [item]: !contact.checklist?.[item]
      }
    };
    currentContacts[contact.id] = updated;
    saveContactsObj(currentContacts);
  };

  // Helper: check if follow-up is due/overdue
  const isFollowUpDue = (dateStr: string, status: string) => {
    if (!dateStr || status === 'Ghosted') return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr <= today;
  };

  // Stats calculation
  const totalCount = contacts.length;
  const awaitingResponse = contacts.filter(c => c.status === 'No Response').length;
  const interviewsBooked = contacts.filter(c => c.status === 'Interview Scheduled').length;
  const followUpDueCount = contacts.filter(c => isFollowUpDue(c.nextFollowUp, c.status)).length;

  // Filter and search logic
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'All' || c.contactRole === roleFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Interview Scheduled':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'In Discussion':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Connected':
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      case 'No Response':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Ghosted':
        return 'bg-zinc-500/20 text-zinc-400 border border-white/10';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border border-white/10';
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white/30 relative pb-20">
      
      {/* Background stars (consistent style) */}
      <div className="starfield-sm opacity-50" />
      <div className="starfield-md opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="flex items-center text-zinc-400 hover:text-white transition-colors text-xs font-semibold gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Board
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                Networking CRM
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage your recruiter contacts, log follow-ups, and track outreach status.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold shadow-lg shadow-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Contacts</p>
            <p className="text-2xl font-extrabold mt-1 text-white">{totalCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Awaiting Response</p>
            <p className="text-2xl font-extrabold mt-1 text-amber-400">{awaitingResponse}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Due for Follow-Up</p>
            <p className="text-2xl font-extrabold mt-1 text-rose-400">{followUpDueCount}</p>
            {followUpDueCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Interviews Booked</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-400">{interviewsBooked}</p>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, notes..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none cursor-pointer focus:border-white/30"
            >
              <option value="All" className="bg-zinc-950">All Roles</option>
              <option value="Recruiter" className="bg-zinc-950">Recruiter</option>
              <option value="Hiring Manager" className="bg-zinc-950">Hiring Manager</option>
              <option value="Referrer" className="bg-zinc-950">Referrer</option>
              <option value="Interviewer" className="bg-zinc-950">Interviewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none cursor-pointer focus:border-white/30"
            >
              <option value="All" className="bg-zinc-950">All Statuses</option>
              <option value="No Response" className="bg-zinc-950">No Response</option>
              <option value="Connected" className="bg-zinc-950">Connected</option>
              <option value="In Discussion" className="bg-zinc-950">In Discussion</option>
              <option value="Interview Scheduled" className="bg-zinc-950">Interview Scheduled</option>
              <option value="Ghosted" className="bg-zinc-950">Ghosted</option>
            </select>
          </div>
        </div>

        {/* Contacts View */}
        {filteredContacts.length === 0 ? (
          <div className="text-center p-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="text-5xl block mb-4">🤝</span>
            <p className="text-lg font-medium text-zinc-400">
              {contacts.length === 0
                ? "No recruiter contacts saved yet."
                : "No contacts match your filters."}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {contacts.length === 0
                ? "Link recruiter contacts to your job cards, or add a standalone contact above."
                : "Try adjusting your search query or filters."}
            </p>
            {contacts.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-1.5 bg-white/10 text-white border border-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all"
              >
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map(contact => {
              const isDue = isFollowUpDue(contact.nextFollowUp, contact.status);
              const totalChecklist = Object.values(contact.checklist || {}).filter(Boolean).length;
              
              return (
                <div
                  key={contact.id}
                  className={`relative rounded-2xl bg-white/5 border backdrop-blur-md p-5 shadow-xl transition-all duration-300 hover:bg-white/8 flex flex-col justify-between ${
                    isDue ? 'border-rose-500/40 hover:border-rose-500/60 shadow-rose-950/20' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {isDue && (
                    <div className="absolute -top-2.5 right-4 bg-rose-500 text-black px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider flex items-center gap-1 shadow-lg animate-pulse uppercase">
                      <Clock className="w-2.5 h-2.5" /> Follow-Up Due
                    </div>
                  )}

                  <div>
                    {/* Header: Name & Role */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white leading-snug">{contact.contactName}</h3>
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{contact.contactRole}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="mb-4">
                      <p className="text-xs text-zinc-400 font-bold">{contact.company}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">{contact.jobTitle}</p>
                    </div>

                    {/* Quick Contacts */}
                    <div className="flex gap-3 mb-4 text-zinc-500">
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-sky-400 transition-colors"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-emerald-400 transition-colors"
                          title={`Email: ${contact.email}`}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Follow up: {contact.nextFollowUp || 'No date'}
                      </span>
                    </div>

                    {/* Progress Checklist bar */}
                    <div className="mb-4 p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="flex justify-between items-center text-[10px] mb-1.5 text-zinc-500">
                        <span>Checklist Progress</span>
                        <span className="font-semibold text-white">{totalChecklist} / 4 tasks</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${(totalChecklist / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'connected', label: 'LinkedIn' },
                          { key: 'pitchSent', label: 'Pitch' },
                          { key: 'appliedFollowUp', label: 'FollowUp' },
                          { key: 'thankYouSent', label: 'Thanks' }
                        ].map((chk) => (
                          <button
                            key={chk.key}
                            onClick={() => toggleChecklistInList(contact, chk.key as keyof CRMChecklist)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                              contact.checklist?.[chk.key as keyof CRMChecklist]
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-white/5 text-zinc-600 border border-white/5 hover:border-white/10 hover:text-zinc-400'
                            }`}
                          >
                            {chk.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes preview */}
                    {contact.notes && (
                      <p className="text-zinc-500 text-xs italic line-clamp-2 border-l border-white/10 pl-2 py-0.5 mb-4">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto">
                    {contact.jobId ? (
                      <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                        Linked to scraped job
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                        Standalone Contact
                      </span>
                    )}

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
              {editingContact ? 'Edit Contact CRM' : 'Add New Connection'}
            </h2>
            <p className="text-xs text-zinc-500 mb-5">
              {editingContact ? 'Modify details, logs, or update checklist for your follow-up.' : 'Track a recruiter or industry connection you reached out to.'}
            </p>

            <form onSubmit={handleSaveContact} className="flex flex-col gap-4">
              
              {/* Row 1: Name and Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Contact Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-amber-500/40 text-sm cursor-pointer"
                  >
                    <option value="Recruiter">Recruiter</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Referrer">Referrer</option>
                    <option value="Interviewer">Interviewer</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Company and Job Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Microsoft"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
              </div>

              {/* Row 3: LinkedIn URL and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formLinkedin}
                    onChange={(e) => setFormLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
              </div>

              {/* Row 4: Status and Follow-Up Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-amber-500/40 text-sm cursor-pointer"
                  >
                    <option value="No Response">No Response</option>
                    <option value="Connected">Connected</option>
                    <option value="In Discussion">In Discussion</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Ghosted">Ghosted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Next Follow-Up *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-2">Networking Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'connected', label: 'LinkedIn Connected' },
                    { key: 'pitchSent', label: 'Sent Pitch Intro' },
                    { key: 'appliedFollowUp', label: 'Sent Apply Follow-up' },
                    { key: 'thankYouSent', label: 'Sent Thank You Note' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={formChecklist[item.key as keyof CRMChecklist]}
                        onChange={() => setFormChecklist(prev => ({ ...prev, [item.key]: !prev[item.key as keyof CRMChecklist] }))}
                        className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Interaction Notes & Logs</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Logs, interview details, specific salary ranges mentioned, etc."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 text-black hover:bg-amber-300 font-extrabold rounded-xl text-sm shadow-lg shadow-amber-400/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Contact</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </main>
  );
}
