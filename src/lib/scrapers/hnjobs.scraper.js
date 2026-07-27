import { BaseScraper } from './scraper.interface.js';
import { isIndiaOrStrictlyRemote } from '../classification.js';

export class HnJobsScraper extends BaseScraper {
  async scrape() {
    try {
      console.log('[HN Jobs] Searching Hacker News Algolia API for latest "Who is hiring" thread...');
      
      const searchUrl = 'https://hn.algolia.com/api/v1/search?tags=story,author_whoishiring&query=Who%20is%20hiring&hitsPerPage=1';
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        throw new Error(`Algolia search API status ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      const hits = searchData.hits || [];
      if (!hits.length || !hits[0].objectID) {
        console.warn('[HN Jobs] No "Who is hiring" thread found.');
        return [];
      }

      const storyId = hits[0].objectID;
      const storyTitle = hits[0].title;
      console.log(`[HN Jobs] Found thread "${storyTitle}" (ID: ${storyId}). Fetching comments...`);

      const commentsUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&hitsPerPage=40`;
      const commentsRes = await fetch(commentsUrl);
      if (!commentsRes.ok) {
        throw new Error(`Algolia comments API status ${commentsRes.status}`);
      }

      const commentsData = await commentsRes.json();
      const comments = commentsData.hits || [];
      console.log(`[HN Jobs] Fetched ${comments.length} hiring comments.`);

      const jobs = [];
      for (const comment of comments) {
        const text = comment.comment_text || '';
        if (!text || text.length < 30) continue;

        const plainText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const firstLine = plainText.split('\n')[0] || plainText;
        const parts = firstLine.split('|').map(p => p.trim());

        let company = parts[0] || 'YC / HN Startup';
        if (company.length > 40) company = company.substring(0, 37) + '...';

        let title = parts[1] || parts[0] || 'Software Engineer';
        if (title.length > 60) title = title.substring(0, 57) + '...';

        let location = parts[2] || 'Remote';
        if (location.length > 50) location = location.substring(0, 47) + '...';

        if (!isIndiaOrStrictlyRemote(location)) continue;

        const descriptionSnippet = plainText.substring(0, 180) + '...';
        const applyUrl = `https://news.ycombinator.com/item?id=${comment.objectID}`;
        const postedDate = comment.created_at || new Date().toISOString();

        jobs.push({
          id: 'hn-' + comment.objectID,
          title: title || 'Software Engineer',
          company: company || 'HN Tech Startup',
          location: location || 'Remote',
          descriptionSnippet,
          applyUrl,
          postedDate
        });
      }

      console.log(`[HN Jobs] Parsed ${jobs.length} startup tech positions.`);
      return jobs;
    } catch (err) {
      console.error('[HN Jobs] Scrape error:', err.message);
      return [];
    }
  }
}
