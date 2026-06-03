const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting localtunnel on port 5000...');
  
  // Spawn localtunnel
  const tunnel = spawn('npx', ['localtunnel', '--port', '5000']);
  
  let tunnelUrl = '';
  
  tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Tunnel]: ${output.trim()}`);
    
    // Parse URL from output: e.g. "your url is: https://flat-geese-give.localtunnel.me"
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
    console.log(`Tunnel process exited with code ${code}`);
    process.exit(code);
  });
}

function startServer(url) {
  console.log(`Starting Express backend with BASE_URL and CLIENT_URL set to: ${url}`);
  
  const server = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, 'server'),
    env: {
      ...process.env,
      PORT: '5000',
      CLIENT_URL: url,
      BASE_URL: url
    }
  });

  server.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });
}

main();
