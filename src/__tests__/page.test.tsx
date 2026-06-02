/**
 * Integration smoke tests for the main page (src/app/page.jsx).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/JobCard', () => ({
  default: ({ job }) => (
    <div data-testid="job-card">{job.title}</div>
  ),
}));

const MOCK_STREAM_JOBS = {
  linkedin:  [{ id: 'li-1', title: 'DevOps Engineer', company: 'LinkedIn', location: 'Bengaluru, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  microsoft: [{ id: 'ms-1', title: 'Senior Azure Engineer', company: 'Microsoft', location: 'Hyderabad, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  google:    [{ id: 'goo-1', title: 'SRE', company: 'Google', location: 'Bengaluru, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  amazon:    [{ id: 'amz-1', title: 'Cloud Ops Engineer', company: 'Amazon', location: 'Chennai, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  apple:     [{ id: 'apl-1', title: 'Infrastructure Eng', company: 'Apple', location: 'Hyderabad, India', descriptionSnippet: 'desc', applyUrl: '#' }],
  nvidia:    [{ id: 'nv-1', title: 'ML Infra Engineer', company: 'Nvidia', location: 'Pune, India', descriptionSnippet: 'desc', applyUrl: '#' }],
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

const lsStore = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (k) => lsStore[k] ?? null,
    setItem: (k, v) => { lsStore[k] = v; },
    removeItem: (k) => { delete lsStore[k]; },
    clear: () => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
  },
});

let Home;

beforeEach(async () => {
  Object.keys(lsStore).forEach(k => delete lsStore[k]);
  vi.clearAllMocks();
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, body: buildSSEStream() });
  vi.resetModules();
  Home = (await import('@/app/page')).default;
});

describe('Home page', () => {
  it('renders search input', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
  });

  it('renders company tab buttons', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
  });

  it('shows job cards after stream completes', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getAllByTestId('job-card').length).toBeGreaterThan(0);
    });
  });

  it('switching to Microsoft tab shows Microsoft jobs', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);
    await userEvent.click(screen.getByRole('button', { name: /Microsoft/i }));
    await waitFor(() => {
      expect(screen.getByText('Senior Azure Engineer')).toBeInTheDocument();
    });
  });

  it('search bar filters job cards by title', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await userEvent.type(searchInput, 'DevOps');
    expect(screen.getByText('DevOps Engineer')).toBeInTheDocument();
  });

  it('clear search button removes filter', async () => {
    render(<Home />);
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await userEvent.type(searchInput, 'xyz-nonexistent');
    expect(screen.getByText(/No jobs matching/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText('\✕'));
    await waitFor(() => screen.getAllByTestId('job-card').length > 0);
  });
});
