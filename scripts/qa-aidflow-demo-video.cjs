const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'demo-video');
const htmlPath = path.join(outDir, 'check-video.html');

fs.writeFileSync(
  htmlPath,
  '<!doctype html><html><body style="margin:0;background:#000">' +
    '<video id="vid" controls autoplay muted style="width:1280px;height:720px" src="AidFlow_3_Minute_Demo.webm"></video>' +
  '</body></html>',
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
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => {
    const v = document.getElementById('vid');
    return {
      readyState: v.readyState,
      duration: Number.isFinite(v.duration) ? v.duration : null,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
      currentTime: v.currentTime,
      error: v.error ? v.error.code : null,
    };
  });
  await page.screenshot({ path: path.join(outDir, 'video-preview.png') });
  await browser.close();
  console.log(JSON.stringify(info, null, 2));
})();
