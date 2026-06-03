const { spawn, execSync } = require('child_process');
const path = require('path');

const SUBDOMAIN = 'linklens-radar-ashwin';
const PORT = '5000';
const LOCAL_HEALTH_URL = `http://localhost:${PORT}/api/health`;
const PUBLIC_HEALTH_URL = `https://${SUBDOMAIN}.loca.lt/api/health`;

let tunnelProcess = null;
let serverProcess = null;
let tunnelUrl = '';
let watchdogInterval = null;

function killProcess(proc) {
  if (!proc) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${proc.pid} /f /t`);
    } catch (e) {}
  } else {
    proc.kill();
  }
}

function startTunnel() {
  console.log(`Starting localtunnel on port ${PORT} (subdomain: ${SUBDOMAIN})...`);
  
  tunnelProcess = spawn('npx', ['localtunnel', '--port', PORT, '--subdomain', SUBDOMAIN], { shell: true });
  
  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Tunnel]: ${output.trim()}`);
    
    const match = output.match(/your url is:\s+(https:\/\/[^\s]+)/i);
    if (match) {
      tunnelUrl = match[1].trim();
      console.log(`\n==================================================`);
      console.log(`🚀 Live Tunnel URL: ${tunnelUrl}`);
      console.log(`==================================================\n`);
      
      startServer(tunnelUrl);
    }
  });

  tunnelProcess.stderr.on('data', (data) => {
    console.error(`[Tunnel Error]: ${data.toString().trim()}`);
  });

  tunnelProcess.on('close', (code) => {
    console.log(`Tunnel process exited with code ${code}. Reconnecting tunnel in 3 seconds...`);
    killProcess(serverProcess);
    serverProcess = null;
    tunnelUrl = '';
    
    setTimeout(() => {
      startTunnel();
    }, 3000);
  });
}

function startServer(url) {
  if (serverProcess) {
    console.log(`Server is already active (PID: ${serverProcess.pid}). Updating URL binding context.`);
    return;
  }

  console.log(`Starting Express backend with BASE_URL and CLIENT_URL set to: ${url}`);
  
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'server'),
    env: {
      ...process.env,
      PORT: PORT,
      CLIENT_URL: url,
      BASE_URL: url
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    serverProcess = null;
  });
}

// Watchdog Auto-Healing monitor (checks every 15 seconds)
function startWatchdog() {
  if (watchdogInterval) clearInterval(watchdogInterval);
  
  watchdogInterval = setInterval(async () => {
    if (!tunnelUrl) return; // Skip if tunnel is initializing

    console.log('[Watchdog]: Checking server and tunnel health status...');
    
    // Check local backend health
    let localHealthy = false;
    try {
      const res = await fetch(LOCAL_HEALTH_URL, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (res.ok && data.ok) {
        localHealthy = true;
      }
    } catch (err) {
      console.log(`[Watchdog]: Local backend health check failed: ${err.message}`);
    }

    if (!localHealthy) {
      console.log('[Watchdog]: Local backend is down. Restarting server process...');
      killProcess(serverProcess);
      serverProcess = null;
      startServer(tunnelUrl);
      return;
    }

    // Check public tunnel health
    let publicHealthy = false;
    try {
      const res = await fetch(PUBLIC_HEALTH_URL, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        publicHealthy = true;
      } else {
        console.log(`[Watchdog]: Public tunnel URL returned status ${res.status}`);
      }
    } catch (err) {
      console.log(`[Watchdog]: Public tunnel check timed out or failed: ${err.message}`);
    }

    if (!publicHealthy) {
      console.log('[Watchdog Warning]: Local server is healthy but public tunnel is unresponsive. Restarting tunnel...');
      // Kill the tunnel process to trigger the 'close' event and cause a clean restart
      killProcess(tunnelProcess);
    } else {
      console.log('[Watchdog]: Healthy connection confirmed. All services operational.');
    }
  }, 15000);
}

// Main execution
startTunnel();
startWatchdog();
