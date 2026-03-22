import { NextResponse } from 'next/server';
import { getScraper } from '@/lib/scrapers/registry';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company') || 'microsoft';
  
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
