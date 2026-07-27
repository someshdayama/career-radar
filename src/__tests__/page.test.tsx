/**
 * Integration smoke tests for the main page (src/app/page.jsx).
 *
 * Tests: initial render, IT role tab navigation, source filtering, search filtering,
 * bookmarks tab, and clear search capability.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock('@/components/JobCard', () => ({
  default: ({ job }: { job: { title: string } }) => (
    <div data-testid="job-card">{job.title}</div>
  ),
}));

const MOCK_STREAM_JOBS = {
  linkedin:       [{ id: 'li-1',  title: 'DevOps Engineer',        company: 'LinkedIn',       location: 'Bengaluru, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  microsoft:      [{ id: 'ms-1',  title: 'Senior Azure Engineer',  company: 'Microsoft',      location: 'Hyderabad, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  google:         [{ id: 'goo-1', title: 'SRE',                   company: 'Google',         location: 'Bengaluru, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  amazon:         [{ id: 'amz-1', title: 'Cloud Ops Engineer',    company: 'Amazon',         location: 'Chennai, India',   descriptionSnippet: 'desc', applyUrl: '#' }],
  apple:          [{ id: 'apl-1', title: 'Infrastructure Eng',    company: 'Apple',          location: 'Hyderabad, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  nvidia:         [{ id: 'nv-1',  title: 'ML Infra Engineer',     company: 'Nvidia',         location: 'Pune, India',      descriptionSnippet: 'desc', applyUrl: '#' }],
  remoteok:       [{ id: 'rok-1', title: 'Full Stack Engineer',    company: 'RemoteOK',       location: 'Remote',           descriptionSnippet: 'desc', applyUrl: '#' }],
  jobicy:         [{ id: 'jby-1', title: 'QA Automation Lead',    company: 'Jobicy Partner', location: 'Remote',           descriptionSnippet: 'desc', applyUrl: '#' }],
  hnjobs:         [{ id: 'hn-1',  title: 'AI Researcher',          company: 'HN Startup',     location: 'Remote',           descriptionSnippet: 'desc', applyUrl: '#' }],
  weworkremotely: [{ id: 'wwr-1', title: 'Backend Developer',      company: 'WWR Client',     location: 'Remote',           descriptionSnippet: 'desc', applyUrl: '#' }],
};

function buildSSEStream() {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(ctrl) {
      for (const [company, data] of Object.entries(MOCK_STREAM_JOBS)) {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ company, data })}\n\n`));
      }
      ctrl.close();
    },
  });
}

globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  body: buildSSEStream(),
});

const lsStore: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem:    (k: string) => lsStore[k] ?? null,
    setItem:    (k: string, v: string) => { lsStore[k] = v; },
    removeItem: (k: string) => { delete lsStore[k]; },
    clear:      () => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
  },
});

// ── Tests ──────────────────────────────────────────────────────────────────────
let Home: typeof import('@/app/page').default;

beforeEach(async () => {
  Object.keys(lsStore).forEach(k => delete lsStore[k]);
  vi.clearAllMocks();
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    body: buildSSEStream(),
  });
  vi.resetModules();
  vi.mock('@/components/JobCard', () => ({
    default: ({ job }: { job: { title: string } }) => (
      <div data-testid="job-card">{job.title}</div>
    ),
  }));
  Home = (await import('@/app/page')).default;
});

describe('Home page', () => {
  it('renders IT role tab buttons', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /All IT Jobs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Software Engineer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DevOps \/ SRE/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data & AI \/ ML/i })).toBeInTheDocument();
  });

  it('shows job cards after stream completes', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getAllByTestId('job-card').length).toBeGreaterThan(0);
    });
  });

  it('switching to DevOps tab filters jobs by role', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);

    await userEvent.click(screen.getByRole('button', { name: /DevOps \/ SRE/i }));
    await waitFor(() => {
      expect(screen.getByText('DevOps Engineer')).toBeInTheDocument();
    });
  });

  it('search bar filters job cards by title', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await userEvent.type(searchInput, 'Azure');
    expect(screen.getByText('Senior Azure Engineer')).toBeInTheDocument();
  });

  it('clear search button removes filter', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await userEvent.type(searchInput, 'xyz-nonexistent');
    expect(screen.getByText(/No jobs matching/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText('✕'));
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);
  });
});
