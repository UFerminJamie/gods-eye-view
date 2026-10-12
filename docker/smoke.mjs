import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const base = process.env.QA_BASE_URL || 'http://localhost:4173';
const output = '/app/qa-artifacts';
fs.mkdirSync(output, { recursive: true });
const report = {
  date: new Date().toISOString(),
  url: base,
  checks: [],
  errors: [],
  failedRequests: [],
};
const check = (name, passed, detail) => {
  report.checks.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`, detail ?? '');
};
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 640 });
page.on('pageerror', (e) => report.errors.push(e.message));
page.on('requestfailed', (r) =>
  report.failedRequests.push({
    url: new URL(r.url()).origin,
    reason: r.failure()?.errorText,
  }),
);
let bytes = 0,
  requests = 0;
page.on('response', (r) => {
  requests++;
  bytes += Number(r.headers()['content-length'] || 0);
});
try {
  const started = performance.now();
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__godsEyeView?.viewer?.scene, {
    timeout: 90000,
  });
  report.initializationMs = Math.round(performance.now() - started);
  await page.evaluate(() =>
    document.querySelector('[data-first-run-choice="explore"]')?.click(),
  );
  const state = await page.evaluate(() => {
    const { viewer, dataManager } = window.__godsEyeView;
    const gl = viewer.scene.context._gl;
    return {
      width: viewer.canvas.width,
      height: viewer.canvas.height,
      globe: viewer.scene.globe.show,
      webgl: gl.getParameter(gl.VERSION),
      layers: [...dataManager.layers.keys()],
    };
  });
  report.initialState = state;
  check(
    'Cesium initialized with WebGL canvas and globe',
    state.width > 0 && state.height > 0 && state.globe,
    state.webgl,
  );
  await page.evaluate(() => {
    window.__godsEyeView.viewer.camera.flyHome(0);
    window.__godsEyeView.viewer.scene.requestRender();
  });
  await new Promise((r) => setTimeout(r, 4000));
  check(
    'full-globe camera reset',
    await page.evaluate(
      () =>
        window.__godsEyeView.viewer.camera.positionCartographic.height >
        1000000,
    ),
  );
  await page.waitForFunction(
    () => {
      const g = window.__godsEyeView.viewer.scene.globe;
      return g.tilesLoaded && g._surface._tilesToRender.length > 0;
    },
    { timeout: 60000 },
  );
  report.firstRenderableGlobeMs = Math.round(performance.now() - started);
  await page.screenshot({ path: `${output}/globe.png` });
  await page.evaluate(() => {
    const v = window.__godsEyeView.viewer;
    v.camera.zoomIn(1000000);
    v.camera.rotateRight(0.1);
    v.scene.requestRender();
  });
  check(
    'zoom and rotation',
    await page.evaluate(() =>
      Number.isFinite(window.__godsEyeView.viewer.camera.heading),
    ),
  );
  for (const style of ['surveillance', 'thermal', 'normal']) {
    await page.evaluate(
      (style) =>
        window.__godsEyeView.styleManager.setStyle(style, {
          userInitiated: true,
        }),
      style,
    );
    check(
      `sensor ${style}`,
      await page.evaluate(
        (style) => window.__godsEyeView.styleManager.activeStyle === style,
        style,
      ),
    );
  }
  const layerNames = [
    'flights',
    'military',
    'satellites',
    'earthquakes',
    'cctv',
    'local-datacenters',
    'local-dams',
  ];
  report.layers = [];
  for (const id of layerNames) {
    const result = await page.evaluate(async (id) => {
      const m = window.__godsEyeView.dataManager,
        e = m.layers.get(id);
      if (!e) return { id, registered: false };
      try {
        await Promise.race([
          m.setEnabled(id, true),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('provider timeout')), 25000),
          ),
        ]);
        return { id, enabled: e.enabled, stats: e.module.getStats?.() ?? null };
      } catch (e) {
        return { id, error: e.message };
      }
    }, id);
    report.layers.push(result);
    check(
      `layer activation ${id}`,
      result.enabled === true,
      JSON.stringify(result),
    );
    await page.evaluate(
      (id) => window.__godsEyeView.dataManager.setEnabled(id, false),
      id,
    );
  }
  await new Promise((r) => setTimeout(r, 8000));
  report.layerData = await page.evaluate(() =>
    [...window.__godsEyeView.dataManager.layers]
      .filter(([, e]) => e.enabled)
      .map(([id, e]) => ({ id, stats: e.module.getStats?.() ?? null })),
  );
  await page.screenshot({ path: `${output}/layers.png` });
  report.frameTiming = await page.evaluate(async () => {
    const v = window.__godsEyeView.viewer;
    const times = [];
    let previous;
    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
      const tick = (t) => {
        if (previous) times.push(t - previous);
        previous = t;
        v.camera.rotateRight(0.002);
        v.scene.requestRender();
        if (times.length < 30) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    return {
      sampledFrames: times.length,
      averageFrameMs: average,
      fps: 1000 / average,
      renderer: 'Docker Chromium SwiftShader; not Mac GPU',
    };
  });
  check(
    'browser API settings and missing credentials',
    await page.evaluate(async () => {
      const r = await fetch('/api/setup/status');
      const s = await r.json();
      return r.ok && Array.isArray(s.keys) && s.keys.every((k) => !k.set);
    }),
  );
  check(
    'no uncaught application errors',
    report.errors.length === 0,
    report.errors.join('; '),
  );
  report.network = {
    requests,
    contentLengthBytes: bytes,
    note: 'Content-Length sum; not total transport bytes',
  };
} catch (e) {
  check('smoke execution', false, e.stack);
} finally {
  await browser.close();
  fs.writeFileSync(`${output}/smoke.json`, JSON.stringify(report, null, 2));
}
assert.ok(
  report.checks.every((c) => c.passed),
  'Smoke checks failed; see qa-artifacts/smoke.json',
);
