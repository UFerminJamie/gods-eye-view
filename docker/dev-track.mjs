import net from 'node:net';
const relay = net.createServer((socket) => {
  const peer = net.connect(4173, '127.0.0.1');
  socket.pipe(peer).pipe(socket);
  socket.on('error', () => peer.destroy());
  peer.on('error', () => socket.destroy());
});
await new Promise((resolve) => relay.listen(4175, '127.0.0.1', resolve));
process.argv = [
  process.argv[0],
  'scripts/track-regression.mjs',
  '--url',
  'http://127.0.0.1:4175',
  '--offline-imagery',
];
// The upstream harness launches main() asynchronously and sets exitCode.
// Close the relay after its result so this wrapper can terminate normally.
const completion = setInterval(() => {
  if (process.exitCode !== undefined) {
    relay.close();
    clearInterval(completion);
  }
}, 250);
completion.unref();
await import('../scripts/track-regression.mjs');
