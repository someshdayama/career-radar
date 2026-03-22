const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Navigating to Microsoft Careers...');
  await page.goto('https://jobs.careers.microsoft.com/global/en/search?l=en_us&lc=India&p=Software%20Engineering&pg=1&pgSq=10&flt=true', { waitUntil: 'networkidle0', timeout: 60000 });
  
  console.log('DOM Loaded. Extracting potential job links...');
  // Find all links that go to a specific job
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
        .filter(a => a.href.includes('/job/') || (!a.href.includes('search') && a.href.includes('careers.microsoft.com/')))
        .map(a => ({
            href: a.href,
            text: a.innerText.trim(),
            parentText: a.parentElement ? a.parentElement.innerText.substring(0, 100) : ''
        }));
  });
  
  fs.writeFileSync('ms-links.json', JSON.stringify(links, null, 2));
  console.log('Found', links.length, 'links.');
  
  const outerHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('ms-body.html', outerHTML);
  
  await browser.close();
})();
