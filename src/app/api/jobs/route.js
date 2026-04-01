import { NextResponse } from 'next/server';
import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company') || 'microsoft';
  
  if (company.toLowerCase() === 'all') {
    const companies = getSupportedCompanies();
    const allJobs = {};
    
    // Performance optimization: Using sequential scraping to avoid 
    // Puppeteer resource exhaustion/timeouts that cause 500 errors.
    for (const c of companies) {
      try {
        const scraper = getScraper(c);
        if (scraper) {
          console.log(`Starting scrape for ${c}...`);
          const data = await scraper.scrape();
          allJobs[c] = data || [];
          console.log(`Finished scrape for ${c}. Found ${data.length} jobs.`);
        }
      } catch (err) {
        console.error(`Scraping error for ${c}:`, err);
        allJobs[c] = []; // Fallback empty array
      }
    }

    return NextResponse.json({ data: allJobs, company: 'all' });
  }

  const scraper = getScraper(company);
  
  if (!scraper) {
    return NextResponse.json(
      { error: `Scraper not found for company: ${company}` },
      { status: 404 }
    );
  }
  
  try {
    const jobs = await scraper.scrape();
    return NextResponse.json({ data: jobs, company });
  } catch (error) {
    console.error(`Error executing scraper for ${company}:`, error);
    return NextResponse.json(
      { error: 'Failed to scrape job listings.' },
      { status: 500 }
    );
  }
}
