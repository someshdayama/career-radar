/**
 * @typedef {Object} JobListing
 * @property {string} id - Unique identifier for the job
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {string} location - Location of the job
 * @property {string} descriptionSnippet - Short description or excerpt
 * @property {string} applyUrl - URL to apply for the job
 * @property {string} [postedDate] - Date the job was posted (ISO string), if available
 */

/**
 * Base Scraper Interface
 */
export class BaseScraper {
  /**
   * Returns mock/fallback jobs for this company.
   * @returns {import('./scraper.interface').JobListing[]}
   */
  getMockJobs() {
    return [];
  }

  /**
   * Scrapes jobs based on criteria.
   * @param {Object} filters - Search filters (e.g., location, role)
   * @returns {Promise<import('./scraper.interface').JobListing[]>}
   */
  async scrape() {
    throw new Error('Method "scrape()" must be implemented.');
  }
}
