/**
 * Unit tests for the JobCard component.
 *
 * Tests: rendering of job details, NEW badge logic with postedDate,
 * click handler, apply link behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import JobCard from '@/components/JobCard';

const BASE_JOB = {
  id: 'test-1',
  title: 'DevOps Engineer',
  company: 'TestCorp',
  location: 'Bengaluru, India',
  descriptionSnippet: 'A great DevOps opportunity with Kubernetes and Terraform.',
  applyUrl: 'https://example.com/apply',
};

describe('JobCard', () => {
  it('renders job title, company, and location', () => {
    render(<JobCard job={BASE_JOB} />);
    expect(screen.getByText(BASE_JOB.title)).toBeInTheDocument();
    expect(screen.getByText(BASE_JOB.company)).toBeInTheDocument();
    expect(screen.getByText(BASE_JOB.location)).toBeInTheDocument();
  });

  it('renders description snippet', () => {
    render(<JobCard job={BASE_JOB} />);
    expect(screen.getByText(BASE_JOB.descriptionSnippet)).toBeInTheDocument();
  });

  it('shows NEW badge when postedDate is within 7 days', () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    render(<JobCard job={{ ...BASE_JOB, postedDate: recentDate }} />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show NEW badge when postedDate is older than 7 days', () => {
    const oldDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days ago
    render(<JobCard job={{ ...BASE_JOB, postedDate: oldDate }} />);
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('does not show NEW badge when no postedDate', () => {
    render(<JobCard job={BASE_JOB} />);
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('shows formatted posted date when postedDate is provided', () => {
    const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    render(<JobCard job={{ ...BASE_JOB, postedDate: recentDate }} />);
    expect(screen.getByText(/Posted \d+d ago/)).toBeInTheDocument();
  });

  it('Apply Now link points to the correct URL', () => {
    render(<JobCard job={BASE_JOB} />);
    const applyLink = screen.getByRole('link', { name: /Apply Now/i });
    expect(applyLink).toHaveAttribute('href', BASE_JOB.applyUrl);
    expect(applyLink).toHaveAttribute('target', '_blank');
  });

  it('calls onSelect handler when clicked', async () => {
    const onSelect = vi.fn();
    render(<JobCard job={BASE_JOB} onSelect={onSelect} />);
    const card = screen.getByRole('button', { name: /View details for DevOps Engineer/i });
    await userEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(BASE_JOB);
  });

  it('does not trigger onSelect when Apply Now is clicked', async () => {
    const onSelect = vi.fn();
    render(<JobCard job={BASE_JOB} onSelect={onSelect} />);
    const applyLink = screen.getByRole('link', { name: /Apply Now/i });
    await userEvent.click(applyLink);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
