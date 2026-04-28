const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

const root = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.dir || path.join(root, 'docs', 'product-demo'));
const videoName = args.video || 'AidFlow_Product_Demo_actual-ui_narrated.webm';
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
