import { describe, it, expect } from 'vitest';
import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';
import { BaseScraper } from '@/lib/scrapers/scraper.interface';

describe('Scrapers Registry', () => {
  it('supports exactly 12 tech company scrapers', () => {
    const companies = getSupportedCompanies();
    expect(companies.length).toBe(12);
    expect(companies).toContain('microsoft');
    expect(companies).toContain('google');
    expect(companies).toContain('amazon');
    expect(companies).toContain('apple');
    expect(companies).toContain('nvidia');
    expect(companies).toContain('linkedin');
    expect(companies).toContain('arbeitnow');
    expect(companies).toContain('remotive');
    expect(companies).toContain('remoteok');
    expect(companies).toContain('jobicy');
    expect(companies).toContain('hnjobs');
    expect(companies).toContain('weworkremotely');
  });

  it('returns valid scraper instance for each company', () => {
    const companies = getSupportedCompanies();
    for (const c of companies) {
      const scraper = getScraper(c);
      expect(scraper).not.toBeNull();
      expect(scraper).toBeInstanceOf(BaseScraper);
      expect(typeof scraper.scrape).toBe('function');
    }
  });

  it('returns null for unknown company ID', () => {
    expect(getScraper('non-existent-company')).toBeNull();
  });
});
