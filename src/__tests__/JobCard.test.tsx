/**
 * Component tests for JobCard.js
 *
 * Tests: renders key fields, bookmark toggle, CRM panel show/hide,
 * "Build Tailored Resume" button, and copy-link interaction.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCard from '@/components/JobCard';

// Silence fetch calls to /api/recruiters/search in tests
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ recruiters: [] }),
});

// localStorage stub
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string) => localStorageStore[k] ?? null,
  setItem:    (k: string, v: string) => { localStorageStore[k] = v; },
  removeItem: (k: string) => { delete localStorageStore[k]; },
  clear:      () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// navigator.clipboard stub
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const MOCK_JOB = {
  id: 'test-job-1',
  title: 'Senior DevOps Engineer',
  company: 'Google',
  location: 'Bengaluru, India',
  descriptionSnippet: 'Build and run SRE pipelines for Google Cloud Platform.',
  applyUrl: 'https://careers.google.com/jobs/1',
};

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('JobCard', () => {
  it('renders job title, company, and location', () => {
    render(<JobCard job={MOCK_JOB} />);
    expect(screen.getByText('Senior DevOps Engineer')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru, India')).toBeInTheDocument();
  });

  it('renders description snippet', () => {
    render(<JobCard job={MOCK_JOB} />);
    expect(screen.getByText(/Build and run SRE pipelines/)).toBeInTheDocument();
  });

  it('shows NEW badge when isNew=true', () => {
    render(<JobCard job={MOCK_JOB} isNew />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show NEW badge when isNew=false', () => {
    render(<JobCard job={MOCK_JOB} isNew={false} />);
    expect(screen.queryByText('NEW')).toBeNull();
  });

  it('Apply Now link points to the correct URL', () => {
    render(<JobCard job={MOCK_JOB} />);
    const applyLink = screen.getByRole('link', { name: /Apply Now/i });
    expect(applyLink).toHaveAttribute('href', MOCK_JOB.applyUrl);
    expect(applyLink).toHaveAttribute('target', '_blank');
  });

  it('clicking bookmark button persists to localStorage', async () => {
    render(<JobCard job={MOCK_JOB} />);
    const bookmarkBtn = screen.getByTitle('Save job');
    await userEvent.click(bookmarkBtn);
    const stored = JSON.parse(localStorageStore['career-radar-bookmarks'] || '{}');
    expect(stored['test-job-1']).toBe(true);
  });

  it('clicking bookmark again removes it from localStorage', async () => {
    render(<JobCard job={MOCK_JOB} />);
    const bookmarkBtn = screen.getByTitle('Save job');
    await userEvent.click(bookmarkBtn); // bookmark
    await userEvent.click(bookmarkBtn); // unbookmark
    const stored = JSON.parse(localStorageStore['career-radar-bookmarks'] || '{}');
    expect(stored['test-job-1']).toBeUndefined();
  });

  it('bookmark toggle dispatches bookmarkChanged CustomEvent', async () => {
    const handler = vi.fn();
    window.addEventListener('bookmarkChanged', handler);
    render(<JobCard job={MOCK_JOB} />);
    await userEvent.click(screen.getByTitle('Save job'));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('bookmarkChanged', handler);
  });

  it('clicking Network button toggles CRM panel', async () => {
    render(<JobCard job={MOCK_JOB} />);
    const networkBtn = screen.getByTitle('Track recruiter networking');
    expect(screen.queryByText(/Link Contact CRM/i)).toBeNull();
    await userEvent.click(networkBtn);
    expect(screen.getByText(/Link Contact CRM/i)).toBeInTheDocument();
    await userEvent.click(networkBtn);
    expect(screen.queryByText(/Link Contact CRM/i)).toBeNull();
  });

  it('clicking copy button calls clipboard.writeText', async () => {
    render(<JobCard job={MOCK_JOB} />);
    const copyBtn = screen.getByTitle('Copy link');
    await userEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_JOB.applyUrl);
  });

  it('Build Tailored Resume button opens resume page and marks storage', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JobCard job={MOCK_JOB} />);
    await userEvent.click(screen.getByText('Build Tailored Resume'));
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/resume'), '_blank');
    const resumes = JSON.parse(localStorageStore['career-radar-resumes'] || '{}');
    expect(resumes['test-job-1']).toBe(true);
    openSpy.mockRestore();
  });

  it('CRM Save requires a contact name', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<JobCard job={MOCK_JOB} />);
    await userEvent.click(screen.getByTitle('Track recruiter networking'));
    // The CRM panel has a "Save" button (with Check icon + "Save" text).
    // The bookmark button also has title="Save job" but not the text "Save".
    const saveBtn = screen.getAllByRole('button').find(
      btn => btn.textContent?.trim() === 'Save'
    )!;
    await userEvent.click(saveBtn);
    expect(alertSpy).toHaveBeenCalledWith('Please enter a contact name.');
    alertSpy.mockRestore();
  });
});
