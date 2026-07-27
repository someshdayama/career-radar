import { LinkedinScraper } from './linkedin.scraper';
import { MicrosoftScraper } from './microsoft.scraper';
import { GoogleScraper } from './google.scraper';
import { AmazonScraper } from './amazon.scraper';
import { AppleScraper } from './apple.scraper';
import { NvidiaScraper } from './nvidia.scraper';
import { ArbeitnowScraper } from './arbeitnow.scraper';
import { RemotiveScraper } from './remotive.scraper';
import { RemoteOKScraper } from './remoteok.scraper';
import { JobicyScraper } from './jobicy.scraper';
import { HnJobsScraper } from './hnjobs.scraper';
import { WeWorkRemotelyScraper } from './weworkremotely.scraper';

const scrapers = {
  linkedin:       new LinkedinScraper(),
  microsoft:      new MicrosoftScraper(),
  google:         new GoogleScraper(),
  amazon:         new AmazonScraper(),
  apple:          new AppleScraper(),
  nvidia:         new NvidiaScraper(),
  arbeitnow:      new ArbeitnowScraper(),
  remotive:       new RemotiveScraper(),
  remoteok:       new RemoteOKScraper(),
  jobicy:         new JobicyScraper(),
  hnjobs:         new HnJobsScraper(),
  weworkremotely: new WeWorkRemotelyScraper(),
};

/**
 * Gets the configured scraper for a given company identifier.
 * @param {string} companyId - The ID of the company (e.g., 'microsoft')
 * @returns {BaseScraper | null}
 */
export function getScraper(companyId) {
  return scrapers[companyId.toLowerCase()] || null;
}

/**
 * Returns a list of supported companies
 */
export function getSupportedCompanies() {
  return Object.keys(scrapers);
}
