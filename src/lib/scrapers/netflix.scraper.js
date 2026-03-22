import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class NetflixScraper extends BaseScraper {
  async scrape() {
    const url = 'https://jobs.netflix.com/search?q=Software%20Engineer&location=India';
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    let jobs = [];
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      
      await new Promise(r => setTimeout(r, 6000));
      
      jobs = await page.evaluate(() => {
        const results = [];
        
        // Netflix uses mostly <a> tags to /jobs/ internally
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/jobs/') && !a.href.includes('/search'));
            
        links.forEach(link => {
            const rawText = link.innerText.trim();
            if (rawText.length < 5) return;
            
            // Look for h3 or h2 title
            const titleEl = link.querySelector('h3, h2, h4') || link;
            const title = titleEl.innerText.trim() || 'Software Engineer';
            
            // Netflix often lists location next to it in spans
            const locSpans = Array.from(link.querySelectorAll('span, div')).filter(el => el.innerText.includes('India'));
            const location = locSpans.length > 0 ? locSpans[0].innerText.trim() : 'India';
            
            results.push({
                id: 'nflx-' + Math.random().toString(36).substring(7),
                title: title,
                company: 'Netflix',
                location: location,
                descriptionSnippet: `Join Netflix. Apply for ${title} located in ${location}.`,
                applyUrl: link.href
            });
        });
        
        const unique = [];
        const seen = new Set();
        for (const job of results) {
            if (!seen.has(job.applyUrl)) {
                seen.add(job.applyUrl);
                unique.push(job);
            }
        }
        
        return unique.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on Netflix:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
