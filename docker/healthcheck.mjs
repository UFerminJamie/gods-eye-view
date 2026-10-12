const base = 'http://127.0.0.1:4173';
try {
  for (const path of ['/healthz', '/', '/api/setup/status']) {
    const response = await fetch(base + path, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error('Unhealthy');
    if (path === '/api/setup/status' && !(await response.json()).keys)
      throw new Error('Missing API');
  }
} catch {
  process.exitCode = 1;
}
