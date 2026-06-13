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

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import os from 'os';
import path from 'path';

function getSystemChromePath() {
  const platform = os.platform();
  if (platform === 'darwin') {
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === 'win32') {
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData\\Local');
    const paths = [
      path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === 'linux') {
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/snap/bin/chromium',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

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
  
  mgr.launchPromise = (async () => {
    let b;
    // Check if running on Vercel specifically
    if (process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
      const chromiumModule = await import('@sparticuz/chromium');
      const chromium = chromiumModule.default || chromiumModule;
      
      b = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      console.log('[BrowserManager] Vercel Serverless Chromium launched');
    } else {
      const chromePath = getSystemChromePath();
      if (!chromePath) {
        throw new Error(
          '[BrowserManager] Google Chrome or Microsoft Edge was not found on your system. ' +
          'Please install Google Chrome or specify its path.'
        );
      }
      
      b = await puppeteer.launch({ 
        executablePath: chromePath,
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      console.log(`[BrowserManager] Local System Chrome launched: ${chromePath}`);
    }
    
    mgr.instance = b;
    mgr.launchPromise = null;
    return b;
  })();
  
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
    } catch {}
    mgr.refCount -= 1;
    if (mgr.refCount <= 0) {
      mgr.refCount = 0;
      if (mgr.instance) {
        try {
          await mgr.instance.close();
        } catch {}
        mgr.instance = null;
        console.log('[BrowserManager] Chromium closed (all scrapers done)');
      }
    }
  };

  return { page, release };
}
