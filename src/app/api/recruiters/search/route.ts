import { NextResponse } from 'next/server';
import { acquireBrowser } from '@/lib/browser-manager';

export const maxDuration = 60; // Allow enough time for browser search

// Strict validation keywords for recruiter titles
const RECRUITER_KEYWORDS = [
  'recruiter', 'talent', 'acquisition', 'hr', 'human resources', 
  'hiring', 'sourcer', 'people partner', 'recruitment', 'talent partner'
];

const DISQUALIFY_KEYWORDS = [
  'software engineer', 'developer', 'designer', 'analyst', 
  'sales representative', 'accountant', 'marketing associate', 'intern'
];

interface RawResult {
  titleText: string;
  url: string;
  snippet: string;
}

interface ScoredRecruiter {
  name: string;
  role: string;
  linkedinUrl: string;
  score: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get('company');
  const location = searchParams.get('location') || 'India';

  if (!company) {
    return NextResponse.json({ error: 'Company is required' }, { status: 400 });
  }

  let page;
  let release;
  try {
    const browserObj = await acquireBrowser();
    page = browserObj.page;
    release = browserObj.release;

    // Search query to target LinkedIn profiles of recruiters at the company and location
    const query = `site:linkedin.com/in/ "recruiter" OR "talent acquisition" OR "hiring manager" "${company}" "${location}"`;
    // Using Bing Search for high reliability and anti-bot stability
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for Bing search results to load
    await page.waitForSelector('li.b_algo', { timeout: 8000 });

    const rawResults = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('li.b_algo'));
      
      const results: RawResult[] = elements.map(el => {
        const titleEl = el.querySelector('h2 a');
        // Bing snippets can be in .b_caption p or .b_lineLimit2
        const snippetEl = el.querySelector('.b_caption p, .b_lineLimit2, .b_algoSlug');
        
        return {
          titleText: titleEl?.textContent || '',
          url: titleEl?.getAttribute('href') || '',
          snippet: snippetEl?.textContent || '',
        };
      });
      return results;
    });

    // Score and validate the results in the backend to ensure high accuracy
    const validatedRecruiters = rawResults
      .filter((r: RawResult) => {
        const url = r.url.toLowerCase();
        // 1. URL Validation: Must be a direct user profile link, not a directory or company page
        return (
          url.includes('linkedin.com/in/') &&
          !url.includes('/dir/') &&
          !url.includes('/company/') &&
          !url.includes('/jobs/') &&
          !url.includes('/pulse/')
        );
      })
      .map((r: RawResult): ScoredRecruiter => {
        const titleLower = r.titleText.toLowerCase();
        const snippetLower = r.snippet.toLowerCase();
        const companyLower = company.toLowerCase();
        
        let score = 0;

        // 2. Company Match Score
        if (titleLower.includes(companyLower)) score += 20;
        if (snippetLower.includes(companyLower)) score += 10;

        // 3. Recruiter Keyword Match Score
        RECRUITER_KEYWORDS.forEach(kw => {
          if (titleLower.includes(kw)) score += 15;
          if (snippetLower.includes(kw)) score += 5;
        });

        // 4. Seniority / Authority Bonuses
        if (titleLower.includes('lead') || titleLower.includes('senior') || titleLower.includes('sr.')) {
          score += 10;
        }
        if (titleLower.includes('manager') || titleLower.includes('head') || titleLower.includes('director')) {
          score += 15;
        }

        // 5. Disqualification Penalty
        DISQUALIFY_KEYWORDS.forEach(kw => {
          if (titleLower.includes(kw)) {
            const hasRecruiterTag = RECRUITER_KEYWORDS.some(tag => titleLower.includes(tag));
            if (!hasRecruiterTag) {
              score -= 50;
            }
          }
        });

        // Parse Name and Role from Title
        const titleClean = r.titleText.replace(/\s*-\s*LinkedIn\s*/gi, '').replace(/\s*\|\s*LinkedIn\s*/gi, '');
        const parts = titleClean.split(/[-|]/);
        const name = parts[0]?.trim() || 'Recruiter';
        const role = parts.slice(1).join(' - ').trim() || 'Talent Acquisition';

        return {
          name,
          role,
          linkedinUrl: r.url,
          score,
        };
      })
      // 6. Threshold Filter: Discard low confidence matches (must score at least 25 points)
      .filter((recruiter: ScoredRecruiter) => recruiter.score >= 25)
      // Sort by highest confidence score first
      .sort((a: ScoredRecruiter, b: ScoredRecruiter) => b.score - a.score)
      .map((rec: ScoredRecruiter) => ({ name: rec.name, role: rec.role, linkedinUrl: rec.linkedinUrl }))
      .slice(0, 3); // Top 3 validated results

    return NextResponse.json({ recruiters: validatedRecruiters });

  } catch (error: any) {
    console.error('Recruiter validated search error:', error);
    return NextResponse.json({ 
      error: 'Failed to search recruiters automatically', 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (release) await release();
  }
}
