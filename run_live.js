const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const subdomain = 'linklens-radar-ashwin';
  console.log(`Starting localtunnel on port 5000 (subdomain: ${subdomain})...`);
  
  // Spawn localtunnel
  const tunnel = spawn('npx', ['localtunnel', '--port', '5000', '--subdomain', subdomain], { shell: true });
  
  let tunnelUrl = '';
  
  tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Tunnel]: ${output.trim()}`);
    
    // Parse URL from output
    const match = output.match(/your url is:\s+(https:\/\/[^\s]+)/i);
    if (match) {
      tunnelUrl = match[1].trim();
      console.log(`\n==================================================`);
      console.log(`🚀 Live Tunnel URL: ${tunnelUrl}`);
      console.log(`==================================================\n`);
      
      // Start backend with tunnelUrl env
      startServer(tunnelUrl);
    }
  });

  tunnel.stderr.on('data', (data) => {
    console.error(`[Tunnel Error]: ${data.toString().trim()}`);
  });

  tunnel.on('close', (code) => {
    console.log(`Tunnel process exited with code ${code}. Restarting tunnel in 3 seconds...`);
    setTimeout(main, 3000);
  });
}

let serverProcess = null;
function startServer(url) {
  if (serverProcess) {
    console.log(`Tunnel reconnected. Server is already active (PID: ${serverProcess.pid}).`);
    return;
  }

  console.log(`Starting Express backend with BASE_URL and CLIENT_URL set to: ${url}`);
  
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'server'),
    env: {
      ...process.env,
      PORT: '5000',
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

main();
