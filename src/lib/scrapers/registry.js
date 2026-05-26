import { MicrosoftScraper } from './microsoft.scraper';
import { GoogleScraper } from './google.scraper';
import { AmazonScraper } from './amazon.scraper';
import { AppleScraper } from './apple.scraper';
import { NvidiaScraper } from './nvidia.scraper';

const scrapers = {
  microsoft: new MicrosoftScraper(),
  google:    new GoogleScraper(),
  amazon:    new AmazonScraper(),
  apple:     new AppleScraper(),
  nvidia:    new NvidiaScraper(),
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
