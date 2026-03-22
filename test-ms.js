const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // We will store interesting JSON responses
  page.on('response', async (response) => {
    const url = response.url();
    const type = response.request().resourceType();
    
    if (type === 'xhr' || type === 'fetch') {
      try {
        const json = await response.json();
        // Check if this looks like a jobs response
        const str = JSON.stringify(json);
        if (str.includes('jobId') || str.includes('title') || str.includes('Software Engineering')) {
            console.log('\n--- FOUND POTENTIAL JOBS HTTP RESPONSE ---');
            console.log('URL:', url);
            fs.writeFileSync('ms-jobs.json', JSON.stringify(json, null, 2));
            console.log('Saved to ms-jobs.json');
        }
      } catch (e) {
        // ignore
      }
    }
  });

  console.log('Navigating to Microsoft Careers...');
  await page.goto('https://jobs.careers.microsoft.com/global/en/search?l=en_us&lc=India&p=Software%20Engineering&pg=1&pgSq=10&flt=true', { waitUntil: 'networkidle0', timeout: 60000 });
  
  console.log('Wait a few seconds for data to load...');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
