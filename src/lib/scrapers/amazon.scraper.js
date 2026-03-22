import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class AmazonScraper extends BaseScraper {
  async scrape() {
    const url = 'https://www.amazon.jobs/en/search?base_query=Software+Engineer&loc_query=India';
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let jobs = [];
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      
      // Wait for Amazon's job list container
      await new Promise(r => setTimeout(r, 5000));
      
      jobs = await page.evaluate(() => {
        const results = [];
        
        // Amazon typically uses elements with class 'job' or '.job-tile'
        const rawLinks = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/jobs/') && (!a.classList.contains('button') && !a.classList.contains('btn')));
            
        // We look for divs that hold job info
        const jobTiles = document.querySelectorAll('.job-tile, .job, article, div[data-job-id]');
        
        if (jobTiles.length > 0) {
            jobTiles.forEach(tile => {
                const titleEl = tile.querySelector('h2, h3, .job-title');
                if (!titleEl) return;
                
                const title = titleEl.innerText.trim();
                const linkEl = tile.tagName === 'A' ? tile : tile.querySelector('a');
                const href = linkEl ? linkEl.href : window.location.href;
                
                const locEl = tile.querySelector('.location-and-id, .location, span.locality');
                const location = locEl ? locEl.innerText.trim().split('|')[0] : 'India';
                
                const descEl = tile.querySelector('.description, p');
                const desc = descEl ? descEl.innerText.trim().substring(0, 150) + '...' : `Software Engineering opportunity at Amazon in ${location}.`;
                
                results.push({
                    id: 'amzn-' + Math.random().toString(36).substring(7),
                    title: title,
                    company: 'Amazon',
                    location: location,
                    descriptionSnippet: desc,
                    applyUrl: href
                });
            });
        }
        
        return results.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on Amazon:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
