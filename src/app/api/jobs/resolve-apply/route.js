import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is required', { status: 400 });
  }

  try {
    console.log(`[Resolver] Resolving: ${targetUrl}`);

    // If it's already a direct apply link, or not from a tracking portal, redirect immediately
    if (!targetUrl.includes('linkedin.com') && !targetUrl.includes('jobs-guest')) {
      return NextResponse.redirect(targetUrl);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url || targetUrl;
    console.log(`[Resolver] Resolved to: ${finalUrl}`);
    
    return NextResponse.redirect(finalUrl);
  } catch (err) {
    console.error(`[Resolver] Error resolving ${targetUrl}:`, err.message);
    // Fallback redirect to targetUrl if resolution fails
    return NextResponse.redirect(targetUrl);
  }
}
