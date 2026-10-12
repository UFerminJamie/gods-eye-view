import fs from 'node:fs';
import net from 'node:net';
import puppeteer from 'puppeteer';
const output = '/app/qa-artifacts';
fs.mkdirSync(output, { recursive: true });
// Shared app network namespace: relay the dev host port for its HMR client.
const relay = net.createServer((socket) => {
  const peer = net.connect(4173, '127.0.0.1');
  socket.pipe(peer).pipe(socket);
  socket.on('error', () => peer.destroy());
  peer.on('error', () => socket.destroy());
  socket.on('close', () => peer.destroy());
});
await new Promise((resolve) => relay.listen(4175, '127.0.0.1', resolve));
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });
const session = await page.createCDPSession();
await session.send('Network.enable');
const sockets = [],
  frames = [];
session.on('Network.webSocketHandshakeResponseReceived', (e) =>
  sockets.push({ url: e.response.url, status: e.response.status }),
);
session.on('Network.webSocketFrameReceived', (e) =>
  frames.push(e.response.payloadData),
);
const file = '/app/style.css';
const original = fs.readFileSync(file, 'utf8');
try {
  await page.goto('http://localhost:4175', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForFunction(() => window.__godsEyeView?.viewer, {
    timeout: 90000,
  });
  fs.writeFileSync(
    file,
    original + '\n/* Docker bind-mount hot reload check */\n',
  );
  await new Promise((resolve) => setTimeout(resolve, 6000));
  const served = await fetch('http://localhost:4175/style.css').then((r) =>
    r.text(),
  );
  const report = {
    websocketUpgrade: sockets.some((s) => s.status === 101),
    bindMountVisible: served.includes('Docker bind-mount'),
    frames,
    reloadFrame: frames.some(
      (s) => s.includes('full-reload') || s.includes('update'),
    ),
    sockets,
  };
  fs.writeFileSync(`${output}/dev-smoke.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (
    !report.websocketUpgrade ||
    !report.bindMountVisible ||
    !report.reloadFrame
  )
    process.exitCode = 1;
} finally {
  const current = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(
    file,
    current.replace('\n/* Docker bind-mount hot reload check */\n', ''),
  );
  await browser.close();
  relay.close();
}
