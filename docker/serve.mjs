// Local-only Docker ingress. Compose MUST publish exclusively on host loopback.
// Internal loopback preserves upstream credential gates without trusting a
// Docker gateway IP or weakening Origin, Host or forwarding-header checks.
import http from 'node:http';
import fs from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { build, createServer, preview, loadEnv } from 'vite';
import { hasProxySignals } from '../src/localRequestGate.mjs';

const dev = process.argv.includes('--dev');
const configFile = '/app/docker/vite.config.mjs';
const configDir = process.env.GEV_CONFIG_DIR || '/config';
fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
fs.chmodSync(configDir, 0o700);
const browserKeys = [
  'GOOGLE_MAPS_API_KEY',
  'CESIUM_ION_TOKEN',
  'MAPILLARY_CLIENT_TOKEN',
];
const fingerprint = (values) =>
  createHash('sha256')
    .update(JSON.stringify(browserKeys.map((k) => values[k] || '')))
    .digest('hex');
const marker = '/app/dist/.gev-provider-fingerprint';
let builtFor = fs.existsSync(marker)
  ? fs.readFileSync(marker, 'utf8')
  : fingerprint({});
const configuredFingerprint = () => {
  const values = loadEnv(dev ? 'development' : 'production', configDir, '');
  for (const key of browserKeys)
    if (process.env[key] !== undefined) values[key] = process.env[key];
  return fingerprint(values);
};
let backend;
let ready = false;
let revision = randomUUID();
let pending;
const ingressSockets = new Set();
const closeHttp = (server) =>
  new Promise((resolve) => {
    if (!server?.listening) return resolve();
    const timer = setTimeout(() => server.closeAllConnections(), 5000);
    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
    server.closeIdleConnections();
  });
const localHost = (host) => {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(`http://${host}`).hostname,
    );
  } catch {
    return false;
  }
};
const allowed = (req) =>
  localHost(req.headers.host) && !hasProxySignals(req.headers);
const ingress = http.createServer((req, res) => {
  if (!allowed(req)) {
    res.writeHead(403);
    res.end('Local access only');
    return;
  }
  if (/^\/(?:\.env(?:[./]|$)|\.git(?:[/?]|$)|config(?:[/?]|$))/.test(req.url)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  if (req.url === '/healthz') {
    res.writeHead(ready ? 200 : 503, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(
      JSON.stringify({
        ready,
        revision,
        mode: dev ? 'development' : 'production',
      }),
    );
    return;
  }
  if (req.url === '/docker-reload.js') {
    res.writeHead(200, {
      'Content-Type': 'text/javascript',
      'Cache-Control': 'no-store',
    });
    res.end(
      `let revision; setInterval(async()=>{try{const r=await fetch('/healthz',{cache:'no-store'});if(!r.ok)return;const s=await r.json();if(revision&&s.revision!==revision)location.reload();revision=s.revision;}catch{}},2000);`,
    );
    return;
  }
  if (!ready) {
    res.writeHead(503, { 'Retry-After': '3' });
    res.end('Application starting; retry shortly.');
    return;
  }
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: 4174,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('Application unavailable');
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});
ingress.on('connection', (socket) => {
  ingressSockets.add(socket);
  socket.once('close', () => ingressSockets.delete(socket));
});
ingress.on('upgrade', (req, socket, head) => {
  if (!ready || !allowed(req)) {
    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    return;
  }
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: 4174,
    path: req.url,
    headers: req.headers,
  });
  upstream.on('upgrade', (response, peer, peerHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(response.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n')}\r\n\r\n`,
    );
    if (head.length) peer.write(head);
    if (peerHead.length) socket.write(peerHead);
    socket.pipe(peer).pipe(socket);
    socket.on('error', () => peer.destroy());
    peer.on('error', () => socket.destroy());
    socket.on('close', () => peer.destroy());
  });
  upstream.on('response', () => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));
  upstream.on('error', () => socket.destroy());
  upstream.end();
});
async function launch() {
  ready = false;
  if (backend) {
    if (dev) await backend.close();
    else await closeHttp(backend.httpServer);
  }
  // Build at runtime: optional public provider keys never enter image layers.
  // The keyless prebuild still verifies packaging during docker compose build.
  const desiredBuild = configuredFingerprint();
  if (!dev && builtFor !== desiredBuild) {
    await build({ configFile });
    fs.writeFileSync(marker, desiredBuild, { mode: 0o600 });
    builtFor = desiredBuild;
  }
  backend = dev
    ? await createServer({ configFile })
    : await preview({ configFile });
  if (dev) await backend.listen();
  revision = randomUUID();
  ready = true;
  console.log(
    `[Docker] ${dev ? 'Development' : 'Production build'} ready on container port 4173`,
  );
}
globalThis.__gevDockerRestart = () =>
  (pending ||= launch().finally(() => {
    pending = undefined;
  }));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => {
    ready = false;
    const deadline = setTimeout(() => {
      for (const socket of ingressSockets) socket.destroy();
      process.exit(0);
    }, 10000);
    await Promise.all([
      closeHttp(ingress),
      dev ? backend?.close() : closeHttp(backend?.httpServer),
    ]);
    clearTimeout(deadline);
    process.exit(0);
  });
}
ingress.listen(4173, '0.0.0.0');
try {
  await launch();
} catch {
  console.error('[Docker] Startup failed; inspect configuration and rebuild.');
  process.exit(1);
}
