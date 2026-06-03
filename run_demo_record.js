const puppeteer = require('./client/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const mongoose = require('./server/node_modules/mongoose');

const SCREENSHOT_DIR = path.join(__dirname, 'demo_screenshots');
const FRAMES_DIR = path.join(__dirname, 'frames');
const VIDEO_PATH = path.join(__dirname, 'demo_walkthrough.mp4');

// Clean folders
if (fs.existsSync(SCREENSHOT_DIR)) {
  fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(SCREENSHOT_DIR);

if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Clearing MongoDB database...');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener');
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    console.log('MongoDB cleared.');
  } catch (err) {
    console.log('MongoDB clear skipped:', err.message);
  }

  console.log('Launching Express backend...');
  const serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'server'),
    env: { ...process.env, PORT: '5000' },
    detached: true,
  });

  await delay(3000);

  console.log('Launching Puppeteer via local Chrome...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const steps = [];
  const capture = async (name) => {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath });
    steps.push(filePath);
    console.log(`Saved screenshot: ${name}.png`);
  };

  try {
    console.log('1. Signup page...');
    await page.goto('http://localhost:5000/signup', { waitUntil: 'networkidle2' });
    await delay(1000);
    await capture('01_signup');

    console.log('2. Submitting signup...');
    const inputs = await page.$$('input');
    await inputs[0].type('Demo User');
    await inputs[1].type('demo_user_s24@example.com');
    await inputs[2].type('password123');
    await page.click('form button');
    await delay(3000);
    await capture('02_dashboard_clean');

    console.log('3. Analyzing URL...');
    await page.type('input[placeholder*="amazon.in"]', 'https://github.com/Ashwin-12032006/LinkRadar');
    await page.evaluate(() => document.activeElement.blur());
    await delay(3000);
    await capture('03_url_analyzed');

    console.log('4. Entering Custom Alias s24 and shortening...');
    await page.type('input[placeholder*="Custom alias"]', 's24');
    await page.click('form button');
    await delay(3000);
    await capture('04_smart_link_created');

    console.log('5. Simulating visitor traffic...');
    const targetRedirectUrl = 'http://localhost:5000/s24';
    const visitors = [
      { ip: '103.21.159.0', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
      { ip: '49.36.100.12', ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36' },
      { ip: '122.160.22.45', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
      { ip: '8.8.8.8', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/114.0' },
    ];
    for (let i = 0; i < visitors.length; i++) {
      await fetch(targetRedirectUrl, {
        headers: { 'X-Forwarded-For': visitors[i].ip, 'User-Agent': visitors[i].ua }
      });
      await delay(400);
    }

    // Reload dashboard to show click tracking
    await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
    await delay(2000);
    await capture('05_dashboard_with_clicks');

    console.log('6. Navigating to Analytics page...');
    const analyticsBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('a')).find(el => el.textContent.includes('Analytics'));
    });
    if (analyticsBtn) {
      await analyticsBtn.click();
    } else {
      await page.goto('http://localhost:5000/analytics/s24', { waitUntil: 'networkidle2' });
    }
    await delay(3000);
    await capture('06_analytics_top');

    // Scroll down to charts
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1500);
    await capture('07_analytics_charts');

    // Scroll to timeline
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1500);
    await capture('08_analytics_timeline');

    console.log('7. Navigating to QR Studio...');
    await page.goto('http://localhost:5000/qr', { waitUntil: 'networkidle2' });
    await delay(2000);
    await capture('09_qr_studio_green');

    // Change QR color to orange
    const colorInput = await page.$('input[placeholder*="e.g."]');
    if (colorInput) {
      await page.evaluate(el => el.value = '', colorInput);
      await colorInput.type('f97316');
      await page.evaluate(el => el.dispatchEvent(new Event('change')), colorInput);
      await delay(2000);
      await capture('10_qr_studio_orange');
    }

    console.log('8. Navigating to Public Stats page...');
    await page.goto('http://localhost:5000/stats/s24', { waitUntil: 'networkidle2' });
    await delay(2500);
    await capture('11_public_stats_top');

    await page.evaluate(() => window.scrollBy(0, 450));
    await delay(1500);
    await capture('12_public_stats_charts');

    console.log('Flow simulation finished!');
  } catch (err) {
    console.error('Error in simulation:', err);
  } finally {
    await browser.close();
  }

  // Kill Express server
  console.log('Stopping Express backend...');
  if (process.platform === 'win32') {
    execSync(`taskkill /pid ${serverProcess.pid} /f /t`);
  } else {
    serverProcess.kill();
  }

  console.log('Duplicating frames for video compilation...');
  let globalFrameIndex = 0;
  // Repeat each screenshot 16 times (~2 seconds each at 8 FPS)
  for (let i = 0; i < steps.length; i++) {
    const srcPath = steps[i];
    for (let f = 0; f < 16; f++) {
      const destName = `frame_${String(globalFrameIndex++).padStart(5, '0')}.png`;
      fs.copyFileSync(srcPath, path.join(FRAMES_DIR, destName));
    }
  }

  console.log(`Stitching ${globalFrameIndex} frames into video...`);
  try {
    execSync(`ffmpeg -y -framerate 8 -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p "${VIDEO_PATH}"`);
    console.log('Video created successfully:', VIDEO_PATH);
  } catch (err) {
    console.error('FFmpeg compile failed:', err.message);
  }

  // Clean frames folder
  try {
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  } catch (e) {}

  console.log('Done.');
}

main();
