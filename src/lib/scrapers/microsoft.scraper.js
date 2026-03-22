import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class MicrosoftScraper extends BaseScraper {
  async scrape() {
    // We use the apply portal search URL which renders jobs much more predictably
    const url = 'https://apply.careers.microsoft.com/careers?hl=en&start=0&location=India&pid=1970393556633020&sort_by=distance&filter_include_remote=1&filter_profession=software+engineering';
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let jobs = [];
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Go to the URL and wait for network to quickly settle
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      
      // Extract jobs based on the a[href*="/job"] pattern
      jobs = await page.evaluate(() => {
        const results = [];
        
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/job'));
            
        links.forEach(link => {
            const rawText = link.innerText.trim();
            if (!rawText || rawText.length < 5 || rawText.toLowerCase().includes('navigating here') || link.href.includes('actioncenter')) return;
            
            // Expected format:
            // "Software Engineer\nIndia, Multiple Locations...\nPosted 6 days ago"
            const parts = rawText.split('\n');
            const title = parts[0] ? parts[0].trim() : 'Software Engineer';
            const location = parts[1] ? parts[1].trim() : 'India';
            const posted = parts[2] ? parts[2].trim() : '';
            
            // We use the ID from the URL: https://apply.careers.microsoft.com/careers/job/1970393556834125
            const urlParts = link.href.split('/job/');
            let id = Math.random().toString(36).substring(7);
            if (urlParts.length > 1) {
                // e.g., "1970393556834125?hl=en"
                id = urlParts[1].split('?')[0];
            }
            
            results.push({
                id: 'msft-' + id,
                title: title,
                company: 'Microsoft',
                location: location,
                descriptionSnippet: posted ? `Opportunity located in ${location}. ${posted}.` : `Explore this Software Engineering opportunity in ${location}.`,
                applyUrl: link.href
            });
        });
        
        // Remove duplicates based on ID
        const uniqueJobs = [];
        const seen = new Set();
        for (const job of results) {
            if (!seen.has(job.id)) {
                seen.add(job.id);
                uniqueJobs.push(job);
            }
        }
        
        return uniqueJobs.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on apply portal:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
