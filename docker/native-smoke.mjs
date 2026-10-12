import fs from 'node:fs';
import puppeteer from 'puppeteer';
const browser = await puppeteer.connect({
  browserWSEndpoint: process.env.QA_BROWSER_WS_ENDPOINT,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const started = performance.now();
const report = { browser: await browser.version(), checks: [], errors: [] };
page.on('pageerror', (e) => report.errors.push(e.message));
try {
  await page.goto('http://localhost:4173', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForFunction(() => window.__godsEyeView?.viewer, {
    timeout: 60000,
  });
  report.initializationMs = Math.round(performance.now() - started);
  await page.waitForSelector('[data-first-run-choice="explore"]', {
    visible: true,
    timeout: 30000,
  });
  await page.click('[data-first-run-choice="explore"]');
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.evaluate(() => {
    const v = window.__godsEyeView.viewer;
    v.camera.flyHome(0);
    v.scene.requestRender();
  });
  await page.waitForFunction(
    () =>
      window.__godsEyeView.viewer.scene.globe._surface._tilesToRender.length >
      0,
    { timeout: 30000 },
  );
  report.settledGlobeMs = Math.round(performance.now() - started);
  await page.screenshot({ path: '/app/qa-artifacts/deployment-globe.png' });
  report.gpu = await page.evaluate(() => {
    const gl = window.__godsEyeView.viewer.scene.context._gl;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl: gl.getParameter(gl.VERSION),
      renderer: ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
    };
  });
  report.navigation = await page.evaluate(async () => {
    const v = window.__godsEyeView.viewer;
    let painted = 0,
      callbacks = 0;
    const begin = performance.now();
    const remove = v.scene.postRender.addEventListener(() => painted++);
    await new Promise((resolve) => {
      const tick = () => {
        callbacks++;
        v.camera.rotateRight(0.001);
        v.scene.requestRender();
        if (performance.now() - begin < 5000) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    remove();
    const seconds = (performance.now() - begin) / 1000;
    return { seconds, painted, callbacks, renderedFps: painted / seconds };
  });
  report.errorsClean = report.errors.length === 0;
  console.log(JSON.stringify(report));
} finally {
  fs.writeFileSync(
    '/app/qa-artifacts/native-smoke.json',
    JSON.stringify(report, null, 2),
  );
  await page.close();
  await browser.disconnect();
}
