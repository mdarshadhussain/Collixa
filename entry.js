const http = require('http');
const httpProxy = require('http-proxy');
const { fork } = require('child_process');
const path = require('path');

// Load environment variables from .env
require('dotenv').config();

const proxy = httpProxy.createProxyServer({});

const fs = require('fs');

// Configuration
const BACKEND_PORT = 5001;
const FRONTEND_PORT = 5002;
const PUBLIC_PORT = process.env.PORT || 8080;

console.log('🚀 Starting Collixa Orchestrator...');

// 1. Launch Backend
const backendPath = path.resolve(__dirname, 'backend', 'src', 'server.js');
console.log(`🔍 Checking Backend: ${backendPath}`);

if (!fs.existsSync(backendPath)) {
  console.error('❌ FATAL: Backend server.js not found at expected path.');
  process.exit(1);
}

const backend = fork(backendPath, [], {
  env: { ...process.env, PORT: BACKEND_PORT, NODE_ENV: 'production' }
});

backend.on('message', (msg) => console.log('[Backend]', msg));
backend.on('error', (err) => console.error('[Backend Error]', err));

// 2. Launch Frontend (Next.js Standalone)
// We check two common standalone locations for monorepos
let frontendPath = path.resolve(__dirname, 'frontend', '.next', 'standalone', 'server.js');
const alternativePath = path.resolve(__dirname, 'frontend', '.next', 'standalone', 'frontend', 'server.js');

if (!fs.existsSync(frontendPath)) {
  if (fs.existsSync(alternativePath)) {
    frontendPath = alternativePath;
  } else {
    console.error('❌ FATAL: Next.js standalone server.js not found.');
    console.log('💡 Tip: Ensure "npm run build" has completed successfully in /frontend');
    process.exit(1);
  }
}

console.log(`🔍 Checking Frontend: ${frontendPath}`);

const frontend = fork(frontendPath, [], {
  env: { 
    ...process.env, 
    PORT: FRONTEND_PORT, 
    NODE_ENV: 'production',
    HOSTNAME: 'localhost'
  }
});

frontend.on('error', (err) => console.error('[Frontend Error]', err));

// 3. Orchestrate Traffic
const server = http.createServer((req, res) => {
  // Route /api to Backend
  if (req.url.startsWith('/api')) {
    proxy.web(req, res, { target: `http://localhost:${BACKEND_PORT}` }, (err) => {
      console.error('Proxy Error (Backend):', err.message);
      res.writeHead(502);
      res.end('Gateway Error (Backend Offline)');
    });
  } 
  // Route everything else to Frontend
  else {
    proxy.web(req, res, { target: `http://localhost:${FRONTEND_PORT}` }, (err) => {
      console.error('Proxy Error (Frontend):', err.message);
      res.writeHead(502);
      res.end('Gateway Error (Frontend Offline)');
    });
  }
});

server.listen(PUBLIC_PORT, () => {
  console.log(`✨ Orchestrator live on port ${PUBLIC_PORT}`);
  console.log(`📡 Routing /api -> :${BACKEND_PORT}`);
  console.log(`🖥️  Routing /*   -> :${FRONTEND_PORT}`);
});
