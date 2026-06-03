const puppeteer = require('./client/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const mongoose = require('./server/node_modules/mongoose');

const SCREENSHOT_DIR = path.join(__dirname, 'demo_screenshots');
const AUDIO_DIR = path.join(__dirname, 'audio_segments');
const FRAMES_DIR = path.join(__dirname, 'frames');
const VIDEO_ONLY_PATH = path.join(__dirname, 'video_only.mp4');
const NARRATION_PATH = path.join(AUDIO_DIR, 'narration.wav');
const FINAL_VIDEO_PATH = path.join(__dirname, 'demo_walkthrough.mp4');

// Cleanup folders
const cleanDirs = [SCREENSHOT_DIR, AUDIO_DIR, FRAMES_DIR];
cleanDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir);
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function generateAudio(text, outputPath) {
  const escapedText = text.replace(/'/g, "''");
  const psCommand = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 2; $s.SetOutputToWaveFile('${outputPath}'); $s.Speak('${escapedText}'); $s.Dispose();`;
  execSync(`powershell -Command "${psCommand}"`);
}

function getAudioDuration(filePath) {
  const output = execSync(`ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  return parseFloat(output);
}

const steps = [
  { name: '01_signup', narration: "Welcome to LinkLens AI. Let's register a new user account." },
  { name: '02_dashboard_clean', narration: "This is our clean dashboard styled with a cybernetic neon theme." },
  { name: '03_url_analyzed', narration: "We paste our long URL, and the safety engine scans it instantly." },
  { name: '04_smart_link_created', narration: "We enter custom alias s24, and secure it with a redirect password." },
  { name: '05_unlock_screen', narration: "Accessing the short URL redirects visitor browsers to a secure unlock shield." },
  { name: '06_dashboard_with_clicks', narration: "Once unlocked, click statistics update automatically on our dashboard." },
  { name: '07_analytics_top', narration: "Open the analytics page to view overall link traffic breakdowns." },
  { name: '08_analytics_charts', narration: "We visualize visitor locations, browser choices, and device distributions." },
  { name: '09_analytics_timeline', narration: "A live visitor timeline tracks pings with agent breakdowns." },
  { name: '10_qr_studio_standard', narration: "In the QR Studio, we generate a standard QR code encoding the short URL." },
  { name: '11_qr_studio_branded', narration: "Toggle branded QR to embed our logo, customize colors, and download." },
  { name: '12_public_stats_top', narration: "LinkLens AI also provides public stats portals that can be shared." },
  { name: '13_public_stats_charts', narration: "This presents transparent traffic analytics to any user. Thank you!" }
];

async function main() {
  console.log('Clearing MongoDB database...');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener_demo');
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    console.log('MongoDB cleared.');
  } catch (err) {
    console.log('MongoDB clear skipped:', err.message);
  }

  console.log('Launching Express backend on port 5001...');
  const serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'server'),
    env: { ...process.env, PORT: '5001', MONGO_URI: 'mongodb://127.0.0.1:27017/url_shortener_demo' },
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

  const screenshotPaths = {};

  const capture = async (name) => {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath });
    screenshotPaths[name] = filePath;
    console.log(`Saved screenshot: ${name}.png`);
  };

  try {
    console.log('1. Signup page...');
    await page.goto('http://localhost:5001/signup', { waitUntil: 'networkidle2' });
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
    await page.type('input[placeholder*="amazon.in"]', 'http://localhost:5001/api/health');
    await page.evaluate(() => document.activeElement.blur());
    await delay(3500);
    await capture('03_url_analyzed');

    console.log('4. Entering Custom Alias s24 and password protection...');
    await page.type('input[placeholder*="Custom alias"]', 's24');
    await page.type('input[placeholder*="Password"]', 'pass123');
    await page.click('form button');
    await delay(3000);
    await capture('04_smart_link_created');

    console.log('5. Navigating to redirect link to trigger Password Gate...');
    await page.goto('http://localhost:5001/s24', { waitUntil: 'networkidle2' });
    await delay(2000);
    await capture('05_unlock_screen');

    console.log('6. Typing password and unlocking...');
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      await pwdInput.type('pass123');
      await page.click('button');
      await delay(3000); // browser will redirect to local /api/health
    }

    console.log('7. Simulating visitor traffic clicks...');
    const targetRedirectUrl = 'http://localhost:5001/s24';
    const visitors = [
      { ip: '103.21.159.0', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
      { ip: '49.36.100.12', ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36' },
      { ip: '122.160.22.45', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
      { ip: '8.8.8.8', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/114.0' },
    ];
    for (let i = 0; i < visitors.length; i++) {
      await fetch(targetRedirectUrl, {
        headers: { 
          'X-Forwarded-For': visitors[i].ip, 
          'User-Agent': visitors[i].ua,
          'Cookie': 'link_access_s24=1' // Set access cookie to count visits instantly
        }
      });
      await delay(500);
    }

    // Reload dashboard to show click tracking
    await page.goto('http://localhost:5001/dashboard', { waitUntil: 'networkidle2' });
    await delay(2000);
    await capture('06_dashboard_with_clicks');

    // Query DB for MongoDB _id
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener_demo');
    const dbLink = await mongoose.connection.db.collection('links').findOne({ shortCode: 's24' });
    const linkId = dbLink ? dbLink._id.toString() : '';
    await mongoose.disconnect();

    console.log('8. Navigating to Analytics page...');
    if (linkId) {
      await page.goto(`http://localhost:5001/analytics/${linkId}`, { waitUntil: 'networkidle2' });
    } else {
      await page.goto('http://localhost:5001/analytics/s24', { waitUntil: 'networkidle2' });
    }
    await delay(3000);
    await capture('07_analytics_top');

    // Scroll down to charts
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1500);
    await capture('08_analytics_charts');

    // Scroll to timeline
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1500);
    await capture('09_analytics_timeline');

    console.log('9. Navigating to QR Studio...');
    if (linkId) {
      await page.goto(`http://localhost:5001/qr/${linkId}`, { waitUntil: 'networkidle2' });
    } else {
      await page.goto('http://localhost:5001/qr', { waitUntil: 'networkidle2' });
    }
    await delay(2500);
    await capture('10_qr_studio_standard');

    // Click branded toggle and change color
    console.log('Clicking branded QR button...');
    const brandedBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Branded'));
    });
    if (brandedBtn) {
      await brandedBtn.click();
      await delay(1000);
    }
    const colorInput = await page.$('input[placeholder*="e.g."]');
    if (colorInput) {
      await page.evaluate(el => el.value = '', colorInput);
      await colorInput.type('f97316');
      await page.evaluate(el => el.dispatchEvent(new Event('change')), colorInput);
      await delay(2000);
    }
    await capture('11_qr_studio_branded');

    console.log('10. Navigating to Public Stats page...');
    await page.goto('http://localhost:5001/stats/s24', { waitUntil: 'networkidle2' });
    await delay(2500);
    await capture('12_public_stats_top');

    await page.evaluate(() => window.scrollBy(0, 450));
    await delay(1500);
    await capture('13_public_stats_charts');

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

  console.log('Synthesizing speech segments and duplicate frames...');
  const audioListContent = [];
  let globalFrameIndex = 0;
  const FPS = 8;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const audioPath = path.join(AUDIO_DIR, `audio_${i}.wav`);
    console.log(`TTS [${step.name}]: "${step.narration}"`);
    
    // Synthesize voice WAV
    generateAudio(step.narration, audioPath);
    
    // Get actual duration of the generated WAV file
    const duration = getAudioDuration(audioPath);
    console.log(`Duration of segment ${i}: ${duration}s`);
    
    // Calculate number of frames to repeat
    const frameCount = Math.round(duration * FPS);
    
    const screenshotFile = screenshotPaths[step.name];
    if (screenshotFile && fs.existsSync(screenshotFile)) {
      for (let f = 0; f < frameCount; f++) {
        const destName = `frame_${String(globalFrameIndex++).padStart(5, '0')}.png`;
        fs.copyFileSync(screenshotFile, path.join(FRAMES_DIR, destName));
      }
    } else {
      console.warn(`Warning: Screenshot file not found for ${step.name}`);
    }
    
    audioListContent.push(`file 'audio_${i}.wav'`);
  }

  // Write audio concat helper list
  fs.writeFileSync(path.join(AUDIO_DIR, 'audio_list.txt'), audioListContent.join('\n'));

  console.log('Concatenating audio segments...');
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i audio_list.txt -c copy narration.wav`, { cwd: AUDIO_DIR });
    console.log('Audio concatenated successfully.');
  } catch (err) {
    console.error('Audio concatenation failed:', err.message);
  }

  console.log(`Stitching ${globalFrameIndex} frames into video track...`);
  try {
    execSync(`ffmpeg -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p "${VIDEO_ONLY_PATH}"`);
    console.log('Video track created successfully.');
  } catch (err) {
    console.error('Video track creation failed:', err.message);
  }

  console.log('Combining video and audio tracks...');
  try {
    execSync(`ffmpeg -y -i "${VIDEO_ONLY_PATH}" -i "${NARRATION_PATH}" -c:v copy -c:a aac -ac 2 -ar 44100 -b:a 128k -shortest "${FINAL_VIDEO_PATH}"`);
    console.log('Final walkthrough compilation complete: ', FINAL_VIDEO_PATH);
  } catch (err) {
    console.error('Combining tracks failed:', err.message);
  }

  // Cleanup temporary outputs and folders
  console.log('Cleaning up temporary workspace files...');
  try {
    if (fs.existsSync(VIDEO_ONLY_PATH)) fs.unlinkSync(VIDEO_ONLY_PATH);
    fs.rmSync(AUDIO_DIR, { recursive: true, force: true });
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }

  console.log('All stages completed!');
}

main();
