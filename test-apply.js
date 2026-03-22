const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Navigating to', 'https://apply.careers.microsoft.com/careers?hl=en&start=0&location=India&pid=1970393556633020&sort_by=distance&filter_include_remote=1&filter_profession=software+engineering');
  await page.goto('https://apply.careers.microsoft.com/careers?hl=en&start=0&location=India&pid=1970393556633020&sort_by=distance&filter_include_remote=1&filter_profession=software+engineering', { waitUntil: 'networkidle0', timeout: 60000 });
  
  console.log('Extracting links...');
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
        .filter(a => a.href.includes('/job'))
        .map(a => ({
            href: a.href,
            text: a.innerText.trim(),
            parentText: a.parentElement ? a.parentElement.innerText.substring(0, 150) : ''
        }));
  });
  
  fs.writeFileSync('ms-apply-links.json', JSON.stringify(links, null, 2));
  
  // also grab the first job card HTML to see structure
  const firstCard = await page.evaluate(() => {
     // this system usually uses li or div.card
     const card = document.querySelector('li, .card, [role="listitem"]');
     return card ? card.innerHTML : 'No card found';
  });
  fs.writeFileSync('ms-card.html', firstCard);

  await browser.close();
})();
