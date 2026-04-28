const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'product-demo');
const videoName = 'AidFlow_Product_Demo_actual-ui_narrated.webm';
const htmlPath = path.join(outDir, 'check-product-demo.html');

fs.writeFileSync(
  htmlPath,
  `<!doctype html><html><body style="margin:0;background:#000"><video id="v" controls autoplay muted style="width:1280px;height:720px" src="${videoName}"></video></body></html>`,
  'utf8'
);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
  await page.waitForTimeout(7000);
  const info = await page.evaluate(() => {
    const v = document.getElementById('v');
    return {
      readyState: v.readyState,
      duration: Number.isFinite(v.duration) ? v.duration : null,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
      currentTime: v.currentTime,
      error: v.error ? v.error.code : null,
    };
  });
  await page.screenshot({ path: path.join(outDir, 'product-demo-preview.png') });
  await browser.close();
  console.log(JSON.stringify({ ...info, bytes: fs.statSync(path.join(outDir, videoName)).size }, null, 2));
})();
