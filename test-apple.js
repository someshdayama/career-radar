const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  console.log('Navigating to Apple Jobs...');
  await page.goto('https://jobs.apple.com/en-in/search?location=india-INDC&key=software%2520engineer', { waitUntil: 'networkidle0', timeout: 60000 });
  
  console.log('Wait a few seconds for data to load...');
  await new Promise(r => setTimeout(r, 6000));
  
  const outerHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('apple-dom.html', outerHTML);
  console.log('DOM saved to apple-dom.html');
  
  // Try my current extraction to see if it works:
  const jobs = await page.evaluate(() => {
        const results = [];
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const titleLink = row.querySelector('.table-col-1 a');
            if (titleLink) results.push(titleLink.innerText.trim());
        });
        return results;
  });
  console.log('Extracted titles:', jobs);
  
  await browser.close();
})();
