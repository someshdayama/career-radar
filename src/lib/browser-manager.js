/**
 * Shared Puppeteer browser manager.
 *
 * Instead of each scraper launching its own Chromium instance (~2-3s overhead each),
 * this module keeps a single browser alive and lets scrapers open individual pages/tabs.
 * Saves ~10-15s for a 5-company batch scrape.
 *
 * Usage:
 *   const { browser, release } = await acquireBrowser();
 *   try {
 *     const page = await browser.newPage();
 *     // ... do scraping ...
 *     await page.close();
 *   } finally {
 *     await release();
 *   }
 */

import puppeteer from 'puppeteer';

if (!globalThis.__browserManager) {
  globalThis.__browserManager = {
    instance: null,
    refCount: 0,
    launchPromise: null,
  };
}

const mgr = globalThis.__browserManager;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function ensureBrowser() {
  if (mgr.instance && mgr.instance.connected) {
    return mgr.instance;
  }
  if (mgr.launchPromise) {
    return mgr.launchPromise;
  }
  
  mgr.launchPromise = puppeteer
    .launch({ 
      headless: 'new', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    .then((b) => {
      mgr.instance = b;
      mgr.launchPromise = null;
      console.log('[BrowserManager] Standard Chromium launched');
      return b;
    });
  
  return mgr.launchPromise;
}

/**
 * Acquires a shared browser and returns it along with a release() function.
 * When all callers have called release(), the browser is closed.
 */
export async function acquireBrowser() {
  mgr.refCount += 1;
  const browser = await ensureBrowser();

  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  const release = async () => {
    try {
      if (!page.isClosed()) await page.close();
    } catch (_) {}
    mgr.refCount -= 1;
    if (mgr.refCount <= 0) {
      mgr.refCount = 0;
      if (mgr.instance) {
        try {
          await mgr.instance.close();
        } catch (_) {}
        mgr.instance = null;
        console.log('[BrowserManager] Chromium closed (all scrapers done)');
      }
    }
  };

  return { page, release };
}
