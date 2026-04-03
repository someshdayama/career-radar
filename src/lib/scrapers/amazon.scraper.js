import { acquireBrowser } from '@/lib/browser-manager';
import { BaseScraper } from './scraper.interface';

// Limit pagination on Netlify free tier to prevent 10s execution timeout
const MAX_PAGES = process.env.NETLIFY ? 1 : 3;

export class AmazonScraper extends BaseScraper {
  async scrape() {
    // Specific search URL provided by the user with additional filters
    const userSearchUrl = 'https://www.amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&category%5B%5D=software-development&category%5B%5D=systems-quality-security-engineering&category%5B%5D=project-program-product-management-technical&country%5B%5D=IND&distanceType=Mi&radius=24km&industry_experience=four_to_six_years&latitude=&longitude=&loc_group_id=&loc_query=India&base_query=Software%20Engineer&city=&country=&region=&county=&query_options=&';
    
    const { page, release } = await acquireBrowser();
    let allJobs = [];
    const seen = new Set();
    const resultLimit = 10; // As specified in the URL

    try {
      for (let pageNum = 0; pageNum < MAX_PAGES; pageNum++) {
        const offset = pageNum * resultLimit;
        const url = userSearchUrl.replace('offset=0', `offset=${offset}`);
        
        console.log(`[Amazon] Scraping Offset ${offset}: ${url}`);
        
        // Amazon is heavy; wait for network to be somewhat idle
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch((err) => {
          console.warn(`[Amazon] Navigation warning at offset ${offset}: ${err.message}`);
        });

        // Wait specifically for the job tiles to appear
        await page.waitForSelector('.job-tile, .job', { timeout: 12000 }).catch(() => {
          console.warn(`[Amazon] Timeout waiting for job tiles at offset ${offset}`);
        });

        const jobs = await page.evaluate(() => {
          const results = [];
          const jobTiles = document.querySelectorAll('.job-tile'); // Use .job-tile to avoid double matching with nested .job
          
          jobTiles.forEach(tile => {
            // Updated selectors based on current Amazon structure
            const titleEl = tile.querySelector('.job-link, h3.job-title, h2');
            if (!titleEl) return;
            
            const title = titleEl.innerText.trim();
            const linkEl = tile.querySelector('a.job-link') || tile.querySelector('a');
            const href = linkEl ? linkEl.href : window.location.href;
            
            // Extract a better ID from the URL (look for numeric ID)
            // Example: /en/jobs/3092179/software-engineer -> 3092179
            const urlParts = href.split('/');
            const idMatch = href.match(/\/jobs\/(\d+)\//) || [null, null];
            const jobId = idMatch[1] || urlParts.pop() || Math.random().toString(36).substring(7);
            
            // Location extraction
            const locEl = tile.querySelector('.location-and-id, .location');
            let location = 'India';
            if (locEl) {
              const text = locEl.innerText.trim();
              location = text.split('|')[0].trim();
            }
            
            // Description snippet
            const descEl = tile.querySelector('.qualifications-preview, .description, p');
            const desc = descEl ? descEl.innerText.trim().substring(0, 200) + '...' : `Software Engineering opportunity at Amazon.`;

            results.push({ 
              id: 'amzn-' + jobId, 
              title, 
              company: 'Amazon', 
              location, 
              descriptionSnippet: desc, 
              applyUrl: href 
            });
          });
          return results;
        });

        console.log(`[Amazon] Found ${jobs.length} jobs at offset ${offset}`);

        let newFound = 0;
        for (const job of jobs) {
          if (!seen.has(job.id)) { 
            seen.add(job.id); 
            allJobs.push(job); 
            newFound++; 
          }
        }
        
        if (newFound === 0 && pageNum > 0) break;
        // Small delay to avoid aggressive rate limiting during pagination
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error('[Amazon] Scrape error:', err.message);
    } finally {
      await release();
    }
    
    console.log(`[Amazon] Total unique jobs found: ${allJobs.length}`);
    return allJobs;
  }
}
