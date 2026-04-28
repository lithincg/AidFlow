const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'product-demo');
const visual = path.join(outDir, 'AidFlow_Product_Demo_actual-ui.webm');
const audio = path.join(outDir, 'product-narration.wav');
const output = path.join(outDir, 'AidFlow_Product_Demo_actual-ui_narrated.webm');

const html = `<!doctype html>
<html>
<body style="margin:0;background:#000">
<video id="v" src="AidFlow_Product_Demo_actual-ui.webm" muted playsinline></video>
<audio id="a" src="product-narration.wav"></audio>
<canvas id="c" width="1280" height="720"></canvas>
<script>
const v = document.getElementById('v');
const a = document.getElementById('a');
const c = document.getElementById('c');
const ctx = c.getContext('2d');

function waitEvent(el, ev) {
  return new Promise((resolve, reject) => {
    el.addEventListener(ev, resolve, { once: true });
    el.addEventListener('error', () => reject(new Error(ev + ' failed')), { once: true });
  });
}

window.__muxAidFlow = async function() {
  if (v.readyState < 1) await waitEvent(v, 'loadedmetadata');
  if (a.readyState < 1) await waitEvent(a, 'loadedmetadata');

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(a);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);

  const stream = c.captureStream(25);
  dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  let chunkCount = 0;
  const rec = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp8,opus',
    videoBitsPerSecond: 4500000,
    audioBitsPerSecond: 128000,
  });
  rec.ondataavailable = async (e) => {
    if (!e.data.size) return;
    const buf = await e.data.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buf));
    await window.__writeMuxChunk(bytes);
    chunkCount += 1;
  };
  rec.start(1000);

  await audioCtx.resume();
  await v.play();
  await a.play();

  let lastFrameTime = 0;
  function frame() {
    ctx.fillStyle = '#070A12';
    ctx.fillRect(0, 0, c.width, c.height);
    if (v.readyState >= 2) {
      ctx.drawImage(v, 0, 0, c.width, c.height);
      lastFrameTime = v.currentTime || lastFrameTime;
    }
    if (!a.ended) requestAnimationFrame(frame);
    else setTimeout(() => rec.stop(), 500);
  }
  frame();
  await new Promise((resolve) => rec.onstop = resolve);
  return { chunkCount };
};
</script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'mux-product-demo.html'), html, 'utf8');

(async () => {
  if (!fs.existsSync(visual)) throw new Error(`Missing visual video: ${visual}`);
  if (!fs.existsSync(audio)) throw new Error(`Missing narration audio: ${audio}`);
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  fs.rmSync(output, { force: true });
  await page.exposeFunction('__writeMuxChunk', async (bytes) => {
    fs.appendFileSync(output, Buffer.from(bytes));
  });
  await page.goto('file:///' + path.join(outDir, 'mux-product-demo.html').replace(/\\/g, '/'));
  const result = await page.evaluate(async () => await window.__muxAidFlow());
  await browser.close();
  console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, ...result }, null, 2));
})();
