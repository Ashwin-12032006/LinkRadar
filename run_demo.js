const puppeteer = require('./client/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'demo_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Starting automated demo recording simulation...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Log page output
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE JS ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  try {
    console.log('Navigating to signup page...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'load' });
    
    // Save initial load screenshot for debugging
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_signup_load.png') });
    
    await page.waitForSelector('input', { timeout: 10000 });
    const inputs = await page.$$('input');
    if (inputs.length >= 3) {
      await inputs[0].type('Demo User');
      await inputs[1].type('demo_user_s24@example.com');
      await inputs[2].type('password123');
      
      console.log('Submitting signup form...');
      const signUpButton = await page.$('form button');
      await signUpButton.click();
      await delay(3000);
    }

    let currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      console.log('Signup did not redirect to dashboard. Attempting login instead...');
      await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_login_load.png') });
      
      await page.waitForSelector('input', { timeout: 5000 });
      const loginInputs = await page.$$('input');
      if (loginInputs.length >= 2) {
        await loginInputs[0].type('demo_user_s24@example.com');
        await loginInputs[1].type('password123');
        
        const loginButton = await page.$('form button');
        await loginButton.click();
        await delay(3000);
      }
    }

    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'load' });
    console.log('Successfully logged in. On Dashboard page.');

    await page.waitForSelector('input[placeholder*="amazon.in"]', { timeout: 5000 });
    const urlInput = await page.$('input[placeholder*="amazon.in"]');
    await urlInput.type('https://github.com/Ashwin-12032006/LinkRadar');
    
    await page.evaluate(() => {
      document.querySelector('input[placeholder*="amazon.in"]').blur();
    });
    console.log('Waiting for AI URL category and threat analysis...');
    await delay(3000);

    const aliasInput = await page.$('input[placeholder*="Custom alias"]');
    await aliasInput.type('s24');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard_pre_creation.png') });

    console.log('Clicking "Shorten with AI"...');
    const shortenBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Shorten with AI'));
    });
    if (shortenBtn) {
      await shortenBtn.click();
    } else {
      const btn = await page.$('form button');
      await btn.click();
    }
    
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_post_creation.png') });
    console.log('Smart link with alias "s24" created successfully.');

    console.log('Simulating rich visitor traffic from different regions and browsers...');
    const targetRedirectUrl = 'http://localhost:5000/s24';
    const visitors = [
      { ip: '103.21.159.0', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
      { ip: '49.36.100.12', ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36' },
      { ip: '122.160.22.45', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
      { ip: '8.8.8.8', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/114.0' },
      { ip: '104.244.42.1', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0' },
      { ip: '194.80.20.1', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15' },
    ];

    for (let i = 0; i < visitors.length; i++) {
      const visitor = visitors[i];
      try {
        console.log(`Click simulation ${i + 1}/${visitors.length}: IP=${visitor.ip}, Device/Browser=${visitor.ua.includes('Mobile') ? 'Mobile' : 'Desktop'}`);
        await fetch(targetRedirectUrl, {
          headers: {
            'X-Forwarded-For': visitor.ip,
            'User-Agent': visitor.ua
          }
        });
        await delay(500);
      } catch (err) {
        console.error(`Click simulation error: ${err.message}`);
      }
    }

    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'load' });
    await page.waitForSelector('table tr', { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_with_visits.png') });

    console.log('Navigating to Analytics page...');
    const analyticsLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find(l => l.textContent.includes('Analytics'));
    });
    if (analyticsLink) {
      await analyticsLink.click();
      await delay(3000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_analytics_page.png') });
      console.log('Captured Analytics page screenshot.');
    } else {
      console.log('Could not find analytics button in table, trying direct navigation...');
      const userLinks = await page.evaluate(async () => {
        const res = await fetch('/api/links', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        return data.links;
      });
      if (userLinks && userLinks.length > 0) {
        const linkId = userLinks[0].id;
        await page.goto(`http://localhost:5173/analytics/${linkId}`, { waitUntil: 'load' });
        await delay(3000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_analytics_page.png') });
        console.log('Captured Analytics page screenshot via direct navigation.');
      }
    }

    console.log('Navigating to QR Studio...');
    const qrLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const qLink = links.find(l => l.textContent.includes('QR'));
      return qLink ? qLink.href : null;
    });
    if (qrLink) {
      await page.goto(qrLink, { waitUntil: 'load' });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_qr_studio_page.png') });
      console.log('Captured QR Studio page screenshot.');
    } else {
      await page.goto('http://localhost:5173/qr', { waitUntil: 'load' });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_qr_studio_page.png') });
    }

    console.log('Navigating to Public Stats...');
    await page.goto('http://localhost:5173/stats/s24', { waitUntil: 'load' });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_public_stats_page.png') });
    console.log('Captured Public Stats page screenshot.');

    console.log('Demo simulation workflow completed successfully!');
    console.log(`Screenshots saved in: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('An error occurred during the demo simulation:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_failure.png') });
  } finally {
    await browser.close();
  }
}

run();
