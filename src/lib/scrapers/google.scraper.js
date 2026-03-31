import puppeteer from 'puppeteer';
import { BaseScraper } from './scraper.interface';

export class GoogleScraper extends BaseScraper {
  async scrape() {
    const url = 'https://www.google.com/about/careers/applications/jobs/results?location=India&skills=cloud';
    
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
      
      // Scroll to trigger lazy loading
      await page.evaluate(async () => {
          window.scrollBy(0, 500);
          await new Promise(r => setTimeout(r, 1000));
      });
      
      jobs = await page.evaluate(() => {
        const results = [];
        // Google Careers results are list items with class .lLd3Je
        const cards = Array.from(document.querySelectorAll('.lLd3Je'));
        
        cards.forEach(card => {
            const titleEl = card.querySelector('h3');
            // The "Learn more" link usually has class .WpHeLc
            const linkEl = card.querySelector('a.WpHeLc');
            // Locations are often in a span with class .r0wTof
            const locEl = card.querySelector('.r0wTof');
            
            if (titleEl && linkEl) {
                let href = linkEl.getAttribute('href') || '';
                // Resolve relative URLs if necessary
                if (href && !href.startsWith('http')) {
                    href = 'https://www.google.com/about/careers/applications/' + href;
                }

                results.push({
                    id: 'goog-' + Math.random().toString(36).substring(7),
                    title: titleEl.innerText.trim(),
                    company: 'Google',
                    location: locEl ? locEl.innerText.trim() : 'India',
                    descriptionSnippet: `Explore this position at Google.`,
                    applyUrl: href
                });
            }
        });
        
        return results.slice(0, 15);
      });
      
    } catch (error) {
      console.error('Puppeteer scraping error on Google:', error);
    } finally {
      await browser.close();
    }
    
    return jobs;
  }
}
