const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'product-demo');
fs.mkdirSync(outDir, { recursive: true });

const demoUrl = 'http://127.0.0.1:5173/?demo=1';
const rawVideoDir = path.join(outDir, 'raw');
fs.rmSync(rawVideoDir, { recursive: true, force: true });
fs.mkdirSync(rawVideoDir, { recursive: true });

const narration = `Hi, this is AidFlow, an AI powered crisis coordination platform for NGOs.

This walkthrough shows the working product itself. We start on the live priority board, where needs are ranked by urgency and status. Opening a case reveals the AI reasoning, staffing requirement, and coordinator actions.

Next, we move into Submit Need, the first key feature: multimodal AI intake. A coordinator can type a report, use voice input, or process an OCR field form. Here we enter a new Ward Five bridge incident, and AidFlow uses Gemini to turn that report into structured crisis data.

The same intake pipeline supports both voice and OCR paths, so field teams can report naturally while the platform extracts operational details like location, affected group, urgency, need type, and volunteer demand.

When we submit the need, the second key feature appears: AI deduplication. Gemini compares the report with open incidents, flags a likely match, and lets the coordinator link it, cancel it, or create it separately.

Back on the priority board, we move into the third key feature, adaptive dispatch. In the volunteer assignment flow, Gemini ranks available volunteers by skill, zone, experience, and urgency, then the AI auto assign action selects the best matching team and explains why.

From there, the demo shifts to the volunteer roster, where coordinators can see who is free and who is busy across the NGO workspace, along with skills, zones, and current commitments.

AidFlow also includes an adaptive learning loop. When a coordinator overrides urgency or need type, that correction is logged and reused as future prompt context, so the system can better reflect how that NGO actually operates.

We then return to the intake view. This is important because disaster reporting is rarely clean or convenient. Voice and OCR options reduce typing and help distributed teams submit reports faster from the field.

Under the hood, this prototype uses React and Vite on the frontend, Firebase Hosting and Authentication for deployment and access control, Cloud Firestore for realtime updates, and Gemini Flash for classification, OCR, deduplication, and volunteer matching.

What makes AidFlow valuable is that these pieces are not separate demos. They work together as one operational loop, from intake to triage to dispatch to human feedback.

AidFlow helps NGOs move from noisy field reports to faster, safer resource allocation.`;

fs.writeFileSync(path.join(outDir, 'product-demo-script.txt'), narration, 'utf8');

const psPath = path.join(outDir, 'make-product-narration.ps1');
const narrationPath = path.join(outDir, 'product-narration.wav');
fs.writeFileSync(psPath, `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft David Desktop')
$synth.Rate = -1
$synth.Volume = 100
$synth.SetOutputToWaveFile('${narrationPath.replace(/\\/g, '\\\\')}')
$synth.Speak('${narration.replace(/'/g, "''")}')
$synth.Dispose()
`, 'utf8');
execFileSync('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', psPath], { stdio: 'inherit' });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function addCaption(page, title, body) {
  await page.evaluate(({ title, body }) => {
    let el = document.getElementById('aidflow-demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aidflow-demo-caption';
      el.style.cssText = [
        'position:fixed',
        'left:32px',
        'bottom:28px',
        'z-index:99999',
        'width:520px',
        'padding:18px 20px',
        'border-radius:18px',
        'background:rgba(5,7,13,.84)',
        'border:1px solid rgba(79,209,197,.28)',
        'box-shadow:0 22px 60px rgba(0,0,0,.38)',
        'backdrop-filter:blur(14px)',
        'font-family:Inter,system-ui,Segoe UI,Arial,sans-serif',
        'color:white',
        'pointer-events:none',
      ].join(';');
      document.body.appendChild(el);
    }
    el.innerHTML = `<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#4FD1C5;font-weight:800;margin-bottom:8px">${title}</div><div style="font-size:19px;line-height:1.28;font-weight:750;color:#EAF2FF">${body}</div>`;
  }, { title, body });
}

async function removeCaption(page) {
  await page.evaluate(() => document.getElementById('aidflow-demo-caption')?.remove());
}

async function clickText(page, text, opts = {}) {
  await page.getByText(text, { exact: opts.exact ?? false }).first().click({ timeout: opts.timeout ?? 15000 });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: rawVideoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await page.goto(demoUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=Priority Board', { timeout: 30000 });
  await sleep(2500);

  await addCaption(page, 'AidFlow product demo', 'A real walkthrough of the working React app, not a slide animation.');
  await sleep(6500);

  await addCaption(page, 'Live priority board', 'Firestore-backed crisis needs are sorted by urgency and status.');
  await sleep(6000);
  await page.getByText('Ward 5, Dharwad').first().click();
  await sleep(4500);
  await addCaption(page, 'Coordinator control', 'Open a need to see AI reasoning, staffing requirements, and operational actions.');
  await sleep(6500);
  await page.keyboard.press('Escape');
  await sleep(1200);

  await clickText(page, 'Submit Need', { exact: true });
  await sleep(2500);
  await addCaption(page, 'Feature 1: Multimodal AI intake', 'Text, voice, and OCR reports become structured crisis data through Gemini.');
  await page.fill('#location', 'Ward 5 bridge, Dharwad');
  await page.fill('#description', 'Another volunteer reports the bridge road is blocked and elderly residents cannot receive medicine.');
  await page.fill('#affectedGroup', 'Elderly residents near Ward 5 bridge');
  await sleep(4000);
  await page.mouse.wheel(0, 520);
  await sleep(2500);
  await addCaption(page, 'Voice + OCR paths', 'The same pipeline supports spoken reports and photographed field forms.');
  await sleep(7000);
  await page.mouse.wheel(0, -620);
  await sleep(1200);

  await addCaption(page, 'Feature 2: AI deduplication', 'Before saving, Gemini compares the new report with open incidents in this organization.');
  await page.getByRole('button', { name: /Classify & Submit Need/i }).click();
  await sleep(3500);
  await addCaption(page, 'Duplicate warning', 'AidFlow explains the likely duplicate and lets the coordinator link, cancel, or create separately.');
  await sleep(9500);
  const cancelButton = page.getByRole('button', { name: /Cancel/i }).last();
  if (await cancelButton.count()) {
    await cancelButton.click({ timeout: 5000 }).catch(() => {});
  }
  await sleep(1500);

  await clickText(page, 'Priority Board', { exact: true });
  await sleep(2200);
  await addCaption(page, 'Realtime operations', 'The board keeps high-priority work visible for dispatch.');
  await sleep(4500);
  await page.getByText('Ward 5, Dharwad').first().click();
  await sleep(2500);
  await addCaption(page, 'Feature 3: Adaptive dispatch', 'Gemini ranks volunteers by skill, zone, experience, and urgency.');
  await clickText(page, 'Assign Volunteers');
  await sleep(5500);
  await page.getByRole('button', { name: /AI Auto-Assign/i }).click();
  await sleep(4500);
  await addCaption(page, 'AI-selected team', 'The app assigns the best matching volunteers and explains the decision.');
  await sleep(8500);
  await page.keyboard.press('Escape');
  await sleep(700);
  await page.keyboard.press('Escape');
  await sleep(1200);

  await page.evaluate(() => { window.location.hash = 'match'; });
  await sleep(2200);
  await addCaption(page, 'Volunteer roster', 'Coordinators can track free and busy volunteers in the same NGO workspace.');
  await sleep(9000);

  await addCaption(page, 'Adaptive learning loop', 'When coordinators override urgency or type, corrections feed future Gemini prompts.');
  await sleep(5000);
  await page.evaluate(() => { window.location.hash = 'board'; });
  await sleep(1800);
  await page.getByText('Ward 5, Dharwad').first().click();
  await sleep(1500);
  await clickText(page, 'Edit Fields');
  await sleep(2000);
  await addCaption(page, 'Human override becomes learning', 'Changing urgency or type logs a correction that calibrates future Gemini prompts.');
  await sleep(12000);
  await page.keyboard.press('Escape');
  await sleep(700);
  await page.keyboard.press('Escape');
  await sleep(1000);

  await page.evaluate(() => { window.location.hash = 'submit'; });
  await sleep(2000);
  await page.mouse.wheel(0, 650);
  await sleep(1000);
  await addCaption(page, 'Field-friendly intake', 'Voice and OCR paths reduce typing for field teams during stressful response work.');
  await sleep(11000);

  await addCaption(page, 'Google stack', 'React + Firebase Hosting + Auth + Cloud Firestore + Gemini Flash.');
  await sleep(9000);

  await addCaption(page, 'AidFlow', 'From noisy field reports to faster, safer resource allocation.');
  await sleep(13000);
  await removeCaption(page);
  await sleep(1000);

  const video = page.video();
  await context.close();
  await browser.close();

  const rawPath = await video.path();
  const visualPath = path.join(outDir, 'AidFlow_Product_Demo_actual-ui.webm');
  fs.copyFileSync(rawPath, visualPath);

  console.log(JSON.stringify({ visualPath, narrationPath, script: path.join(outDir, 'product-demo-script.txt') }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
