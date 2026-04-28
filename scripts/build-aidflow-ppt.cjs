const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs');
const assetDir = path.join(outDir, 'ppt-assets');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'AidFlow';
pptx.subject = 'Google Solution Challenge 2026 prototype presentation';
pptx.title = 'AidFlow - AI-Powered NGO Coordination';
pptx.company = 'AidFlow';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'LAYOUT_WIDE';
pptx.margin = 0;

const C = {
  ink: 'EAF2FF',
  muted: '9AA7B8',
  bg: '070A12',
  panel: '101522',
  panel2: '151C2B',
  blue: '4285F4',
  red: 'EA4335',
  yellow: 'FBBC04',
  green: '34A853',
  cyan: '4FD1C5',
  line: '2A3448',
  white: 'FFFFFF',
};

function addBg(slide) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.bg }, line: { color: C.bg } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.09, fill: { color: C.blue }, line: { color: C.blue } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.09, w: 4.2, h: 0.05, fill: { color: C.red }, line: { color: C.red } });
  slide.addShape(pptx.ShapeType.rect, { x: 4.2, y: 0.09, w: 4.2, h: 0.05, fill: { color: C.yellow }, line: { color: C.yellow } });
  slide.addShape(pptx.ShapeType.rect, { x: 8.4, y: 0.09, w: 4.933, h: 0.05, fill: { color: C.green }, line: { color: C.green } });
}

function footer(slide, n) {
  slide.addText('AidFlow  |  Google Solution Challenge 2026', { x: 0.55, y: 7.08, w: 7, h: 0.18, fontFace: 'Aptos', fontSize: 7.5, color: '687386', margin: 0 });
  slide.addText(String(n).padStart(2, '0'), { x: 12.35, y: 7.02, w: 0.45, h: 0.25, fontFace: 'Aptos', fontSize: 9, color: '687386', bold: true, align: 'right', margin: 0 });
}

function title(slide, s, kicker = '') {
  if (kicker) slide.addText(kicker.toUpperCase(), { x: 0.65, y: 0.56, w: 5.8, h: 0.22, fontSize: 8.5, bold: true, color: C.cyan, charSpace: 1.2, margin: 0 });
  slide.addText(s, { x: 0.62, y: 0.86, w: 9.6, h: 0.56, fontFace: 'Aptos Display', fontSize: 24, bold: true, color: C.ink, margin: 0, breakLine: false, fit: 'shrink' });
}

function pill(slide, text, x, y, w, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.34, rectRadius: 0.06, fill: { color, transparency: 82 }, line: { color, transparency: 35, pt: 0.8 } });
  slide.addText(text, { x: x + 0.08, y: y + 0.09, w: w - 0.16, h: 0.12, fontSize: 7.5, bold: true, color, align: 'center', margin: 0, fit: 'shrink' });
}

function bullet(slide, t, x, y, w, color = C.ink) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.07, w: 0.07, h: 0.07, fill: { color: C.cyan }, line: { color: C.cyan } });
  slide.addText(t, { x: x + 0.18, y, w, h: 0.42, fontSize: 12, color, margin: 0.02, breakLine: false, fit: 'shrink' });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: opts.fill || C.panel, transparency: opts.transparency ?? 0 },
    line: { color: opts.line || C.line, pt: opts.pt || 1 },
    shadow: opts.shadow ? { type: 'outer', color: '000000', opacity: 0.18, blur: 1, angle: 45, distance: 1 } : undefined,
  });
}

function addArrow(slide, x1, y1, x2, y2, color = C.blue) {
  slide.addShape(pptx.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, pt: 1.5, beginArrowType: 'none', endArrowType: 'triangle' } });
}

function cover() {
  const s = pptx.addSlide(); addBg(s);
  s.addText('AidFlow', { x: 0.75, y: 0.75, w: 5.3, h: 0.8, fontFace: 'Aptos Display', fontSize: 44, bold: true, color: C.ink, margin: 0 });
  s.addText('Adaptive AI-native crisis coordination for NGOs', { x: 0.78, y: 1.65, w: 6.1, h: 0.32, fontSize: 15, color: C.muted, margin: 0 });
  s.addText('From noisy field reports to ranked needs, duplicate warnings, and volunteer dispatch in one live Firebase workspace.', { x: 0.78, y: 2.22, w: 5.9, h: 1.05, fontSize: 18, bold: true, color: C.white, margin: 0.02, fit: 'shrink' });
  pill(s, 'Cloud deployment: Firebase Hosting + Firestore', 0.8, 4.42, 2.8, C.blue);
  pill(s, 'Google AI: Gemini Flash', 3.85, 4.42, 1.95, C.green);
  pill(s, 'Live MVP verified', 6.05, 4.42, 1.45, C.yellow);
  const x = 8.1, y = 0.8;
  card(s, x, y, 4.3, 5.55, { fill: '0E1422', line: '25314A', shadow: true });
  s.addText('Field report', { x: x + 0.35, y: y + 0.35, w: 1.8, h: 0.18, fontSize: 9, color: C.muted, margin: 0 });
  card(s, x + 0.35, y + 0.75, 3.6, 0.8, { fill: '151D2E', line: '2A3857' });
  s.addText('Bridge blocked near Ward 5; elderly residents need medicine delivery.', { x: x + 0.58, y: y + 0.98, w: 3.05, h: 0.22, fontSize: 10.5, color: C.ink, margin: 0, fit: 'shrink' });
  addArrow(s, x + 2.15, y + 1.75, x + 2.15, y + 2.25, C.cyan);
  card(s, x + 0.35, y + 2.42, 3.6, 1.22, { fill: '101A2B', line: '325078' });
  s.addText('Gemini classification', { x: x + 0.58, y: y + 2.7, w: 2.4, h: 0.2, fontSize: 10.5, bold: true, color: C.white, margin: 0 });
  pill(s, 'HIGH', x + 0.58, y + 3.1, 0.85, C.red);
  pill(s, 'Infrastructure', x + 1.55, y + 3.1, 1.3, C.yellow);
  addArrow(s, x + 2.15, y + 3.82, x + 2.15, y + 4.32, C.cyan);
  card(s, x + 0.35, y + 4.52, 3.6, 0.62, { fill: '102016', line: '2E6B48' });
  s.addText('Priority board updates in real time', { x: x + 0.58, y: y + 4.73, w: 3.0, h: 0.18, fontSize: 10.5, bold: true, color: 'BFF7D4', margin: 0, fit: 'shrink' });
  footer(s, 1);
}

function team() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Team details', 'submission profile');
  card(s, 0.75, 1.75, 5.2, 3.6, { fill: '0E1422', line: '26314A', shadow: true });
  s.addText('Team name', { x: 1.1, y: 2.12, w: 2, h: 0.2, fontSize: 9, color: C.muted, bold: true, margin: 0 });
  s.addText('AidFlow', { x: 1.1, y: 2.45, w: 3.5, h: 0.48, fontSize: 26, bold: true, color: C.ink, margin: 0 });
  s.addText('Team leader', { x: 1.1, y: 3.28, w: 2, h: 0.2, fontSize: 9, color: C.muted, bold: true, margin: 0 });
  s.addText('Lithin C G', { x: 1.1, y: 3.58, w: 3.5, h: 0.38, fontSize: 20, bold: true, color: C.white, margin: 0 });
  s.addText('Working prototype', { x: 1.1, y: 4.4, w: 2, h: 0.2, fontSize: 9, color: C.muted, bold: true, margin: 0 });
  s.addText('https://smart-resource-allocatio-3e4d2.web.app', { x: 1.1, y: 4.7, w: 4.3, h: 0.22, fontSize: 10.5, color: C.cyan, margin: 0, hyperlink: { url: 'https://smart-resource-allocatio-3e4d2.web.app' }, fit: 'shrink' });
  s.addText('Problem statement', { x: 6.6, y: 1.95, w: 2.8, h: 0.25, fontSize: 11, color: C.cyan, bold: true, margin: 0 });
  s.addText('During chaotic crises, NGOs receive repeated, multilingual, and incomplete field reports. Coordinators must manually classify urgency, avoid duplicate dispatches, and match volunteers while conditions keep changing.', { x: 6.6, y: 2.42, w: 5.6, h: 1.45, fontSize: 19, bold: true, color: C.ink, margin: 0.02, fit: 'shrink' });
  s.addText('AidFlow turns that noisy intake into a live, AI-ranked coordination board for one NGO workspace at a time.', { x: 6.62, y: 4.42, w: 5.15, h: 0.5, fontSize: 13, color: C.muted, margin: 0, fit: 'shrink' });
  footer(s, 2);
}

function solution() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Brief about the solution', 'what aidflow does');
  s.addText('AidFlow is an AI-powered NGO coordination pipeline built on Firebase and Gemini. Field workers submit text, voice, or OCR reports; Gemini classifies urgency and type; the app checks for duplicate/related reports; coordinators assign volunteers and correct AI outputs when needed.', { x: 0.8, y: 1.72, w: 7.4, h: 1.25, fontSize: 18, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  const items = [
    ['Multimodal intake', 'Text forms, in-browser speech recognition, and image OCR.'],
    ['Adaptive prompts', 'Recent coordinator overrides become few-shot examples.'],
    ['Live operations', 'Firestore listeners update needs, volunteers, and status in real time.'],
    ['Safer dispatch', 'Duplicate warnings and transaction-based assignments reduce wasted effort.'],
  ];
  items.forEach((it, i) => {
    const x = 0.9 + (i % 2) * 5.9, y = 3.35 + Math.floor(i / 2) * 1.25;
    card(s, x, y, 5.35, 0.86, { fill: i % 2 ? '0F1728' : '111827', line: '2C3A55' });
    s.addText(it[0], { x: x + 0.24, y: y + 0.19, w: 1.9, h: 0.2, fontSize: 11, bold: true, color: C.white, margin: 0 });
    s.addText(it[1], { x: x + 2.12, y: y + 0.17, w: 2.9, h: 0.26, fontSize: 9.8, color: C.muted, margin: 0, fit: 'shrink' });
  });
  footer(s, 3);
}

function opportunities() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Opportunities', 'why this is different');
  const heads = ['Different from static forms', 'Solves coordinator overload', 'USP'];
  const body = [
    'AidFlow treats the report stream as messy real-world data: spoken, photographed, multilingual, duplicated, and constantly corrected by humans.',
    'Gemini structures each report, Firestore syncs it instantly, and duplicate checks prevent multiple volunteers from chasing the same incident.',
    'The adaptive learning loop records human overrides and feeds recent corrections back into future prompts, so each NGO can calibrate priority rules over time.',
  ];
  [0,1,2].forEach(i => {
    card(s, 0.85 + i * 4.1, 1.85, 3.55, 3.6, { fill: i === 2 ? '0F2118' : '0E1422', line: i === 2 ? '276B46' : '26314A', shadow: true });
    s.addText(heads[i], { x: 1.12 + i * 4.1, y: 2.25, w: 2.95, h: 0.38, fontSize: 15, bold: true, color: i === 0 ? C.blue : i === 1 ? C.yellow : C.green, margin: 0, fit: 'shrink' });
    s.addText(body[i], { x: 1.12 + i * 4.1, y: 3.0, w: 2.9, h: 1.45, fontSize: 13.2, color: C.ink, margin: 0.02, fit: 'shrink' });
  });
  footer(s, 4);
}

function features() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Features offered by the solution', 'implemented mvp');
  const data = [
    ['01', 'Multilingual Voice-to-Need', 'English, Hindi, Kannada, Telugu, and Marathi speech input via Web Speech API, then Gemini extraction.'],
    ['02', 'Gemini OCR Intake', 'Image reports are compressed, sent to Gemini Vision-style prompts, extracted, classified, and reviewed.'],
    ['03', 'AI Deduplication Check', 'Incoming text reports are semantically compared against open reports before save.'],
    ['04', 'Adaptive AI Learning Loop', 'Coordinator changes to urgency/type are logged and reused as few-shot calibration examples.'],
    ['05', 'Realtime Priority Board', 'Firestore subscriptions power live need counts, filters, AI accuracy badge, and status flow.'],
    ['06', 'Volunteer Dispatch', 'Gemini ranks free volunteers against open needs; Firestore transactions assign and resolve work.'],
  ];
  data.forEach((d, i) => {
    const x = 0.75 + (i % 2) * 6.05, y = 1.65 + Math.floor(i / 2) * 1.55;
    s.addText(d[0], { x, y: y + 0.07, w: 0.5, h: 0.24, fontSize: 12, bold: true, color: [C.blue,C.red,C.yellow,C.green,C.cyan,C.white][i], margin: 0 });
    s.addText(d[1], { x: x + 0.65, y, w: 4.2, h: 0.25, fontSize: 13.5, bold: true, color: C.white, margin: 0, fit: 'shrink' });
    s.addText(d[2], { x: x + 0.65, y: y + 0.35, w: 4.75, h: 0.35, fontSize: 9.8, color: C.muted, margin: 0, fit: 'shrink' });
  });
  footer(s, 5);
}

function processFlow() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Process flow diagram', 'from report to learning');
  const nodes = [
    ['1', 'Input', 'Voice, text, or OCR report'],
    ['2', 'Gemini processing', 'JSON urgency/type extraction'],
    ['3', 'Dedup check', 'Compare against open org reports'],
    ['4', 'Priority board', 'Realtime Firestore update'],
    ['5', 'Coordination', 'Rank and assign volunteers'],
    ['6', 'Learning', 'Overrides feed future prompts'],
  ];
  nodes.forEach((n, i) => {
    const x = 0.72 + i * 2.05, y = i % 2 ? 3.82 : 2.05;
    card(s, x, y, 1.52, 1.02, { fill: '0E1422', line: '2A3B5C' });
    s.addText(n[0], { x: x + 0.12, y: y + 0.12, w: 0.28, h: 0.2, fontSize: 10, bold: true, color: C.cyan, margin: 0 });
    s.addText(n[1], { x: x + 0.15, y: y + 0.38, w: 1.18, h: 0.2, fontSize: 10.5, bold: true, color: C.white, margin: 0, fit: 'shrink' });
    s.addText(n[2], { x: x + 0.15, y: y + 0.68, w: 1.18, h: 0.22, fontSize: 7.8, color: C.muted, margin: 0, fit: 'shrink' });
    if (i < nodes.length - 1) addArrow(s, x + 1.55, y + 0.52, x + 1.95, (i % 2 ? 2.57 : 4.34), [C.blue,C.red,C.yellow,C.green,C.cyan][i]);
  });
  s.addText('The key loop is not just intake. Human coordinator corrections are persisted, measured, and injected back into Gemini prompts.', { x: 1.35, y: 6.1, w: 10.6, h: 0.32, fontSize: 14, bold: true, color: C.ink, align: 'center', margin: 0, fit: 'shrink' });
  footer(s, 6);
}

function wireframes() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Wireframes / mock diagrams', 'core screens');
  const panels = [
    ['Submit Need', ['Location', 'Problem description', 'Affected group', 'Classify & Submit Need']],
    ['Voice Report', ['Language selector', 'Animated waveform', 'Live transcript', 'Process with AI']],
    ['Priority Board', ['High Priority count', 'Status filters', 'Need cards', 'Detail modal actions']],
  ];
  panels.forEach((p, i) => {
    const x = 0.72 + i * 4.22;
    card(s, x, 1.75, 3.62, 4.58, { fill: '0D1320', line: '2B3B59', shadow: true });
    s.addText(p[0], { x: x + 0.3, y: 2.12, w: 2.6, h: 0.28, fontSize: 14, bold: true, color: C.white, margin: 0 });
    p[1].forEach((t, j) => {
      const yy = 2.75 + j * 0.65;
      card(s, x + 0.35, yy, 2.9, 0.35, { fill: j === 3 ? '123125' : '151D2D', line: j === 3 ? '2E7D55' : '2A3853' });
      s.addText(t, { x: x + 0.55, y: yy + 0.11, w: 2.45, h: 0.1, fontSize: 8.6, color: j === 3 ? 'BFF7D4' : C.muted, bold: j === 3, margin: 0, fit: 'shrink' });
    });
    if (i === 1) {
      for (let b = 0; b < 18; b++) {
        const h = [0.1,0.25,0.42,0.22,0.55,0.35][b % 6];
        s.addShape(pptx.ShapeType.rect, { x: x + 0.65 + b * 0.12, y: 5.65 - h, w: 0.04, h, fill: { color: C.red, transparency: 18 }, line: { color: C.red, transparency: 100 } });
      }
    }
  });
  footer(s, 7);
}

function architecture() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Architecture diagram', 'firebase + gemini stack');
  const boxes = [
    ['Frontend', 'React 19 + Vite + Tailwind CSS\nHosted on Firebase Hosting', 0.8, 2.2, C.blue],
    ['Auth & Tenant Gate', 'Firebase Authentication\nOrg picker + 4-digit PIN join', 3.85, 1.35, C.green],
    ['Realtime Database', 'Cloud Firestore\nneeds, volunteers, orgs, corrections', 6.9, 2.2, C.yellow],
    ['AI Layer', 'Gemini Flash API\nJSON classification, OCR, ranking, dedup', 9.95, 1.35, C.red],
  ];
  boxes.forEach(b => {
    card(s, b[2], b[3], 2.45, 1.35, { fill: '0E1422', line: b[4], pt: 1.2 });
    s.addText(b[0], { x: b[2] + 0.18, y: b[3] + 0.22, w: 2.0, h: 0.22, fontSize: 12, bold: true, color: b[4], margin: 0, fit: 'shrink' });
    s.addText(b[1], { x: b[2] + 0.18, y: b[3] + 0.58, w: 2.02, h: 0.45, fontSize: 8.8, color: C.ink, margin: 0, fit: 'shrink' });
  });
  addArrow(s, 3.25, 2.87, 3.82, 2.2, C.blue);
  addArrow(s, 6.3, 2.2, 6.88, 2.87, C.green);
  addArrow(s, 9.35, 2.85, 9.92, 2.2, C.yellow);
  addArrow(s, 11.2, 2.78, 7.9, 4.65, C.red);
  card(s, 3.2, 4.52, 6.9, 0.85, { fill: '102016', line: '2E6B48' });
  s.addText('Adaptive loop: coordinator override -> corrections collection -> few-shot block -> next Gemini classification', { x: 3.55, y: 4.83, w: 6.2, h: 0.18, fontSize: 11, bold: true, color: 'BFF7D4', align: 'center', margin: 0, fit: 'shrink' });
  footer(s, 8);
}

function tech() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Technologies used', 'verified from codebase');
  const rows = [
    ['Google Cloud Platform', 'Firebase Hosting, Cloud Firestore, Firebase Authentication, Firebase Functions scaffold'],
    ['Google AI', 'Gemini Flash model for classification, OCR extraction, volunteer ranking, and duplicate analysis'],
    ['Frontend', 'React 19.2, Vite 8, Tailwind CSS 3.4, code-split tabs'],
    ['Browser APIs', 'Web Speech API for continuous multilingual voice capture'],
    ['Data safety patterns', 'Org-scoped queries, authenticated writes, Firestore transactions for assignment state'],
  ];
  rows.forEach((r, i) => {
    const y = 1.75 + i * 0.82;
    s.addText(r[0], { x: 1.0, y, w: 2.65, h: 0.22, fontSize: 12.5, bold: true, color: [C.blue,C.green,C.yellow,C.red,C.cyan][i], margin: 0, fit: 'shrink' });
    s.addText(r[1], { x: 4.0, y: y - 0.02, w: 7.9, h: 0.25, fontSize: 12.2, color: C.ink, margin: 0, fit: 'shrink' });
    s.addShape(pptx.ShapeType.line, { x: 1.0, y: y + 0.46, w: 10.9, h: 0, line: { color: '1C2637', pt: 0.8 } });
  });
  footer(s, 9);
}

function cost() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Estimated implementation cost', 'prototype stage');
  s.addText('$0.00 / month', { x: 0.85, y: 1.78, w: 4.2, h: 0.75, fontSize: 38, bold: true, color: C.green, margin: 0 });
  s.addText('Current MVP target using free-tier-friendly Firebase and Gemini development usage.', { x: 0.9, y: 2.72, w: 4.9, h: 0.44, fontSize: 14, color: C.muted, margin: 0, fit: 'shrink' });
  const points = [
    ['Firebase Spark Plan', 'Hosting, Auth, and Firestore are enough for demo-scale prototype traffic.'],
    ['Gemini free-tier development', 'Prototype calls use Gemini Flash for low-latency classification and extraction.'],
    ['Scale path', 'Move AI calls fully behind Cloud Functions + Secret Manager on Blaze for production security and quotas.'],
  ];
  points.forEach((p, i) => {
    card(s, 6.25, 1.65 + i * 1.22, 5.55, 0.82, { fill: '0E1422', line: '26314A' });
    s.addText(p[0], { x: 6.55, y: 1.88 + i * 1.22, w: 1.9, h: 0.18, fontSize: 10.5, bold: true, color: [C.blue,C.green,C.yellow][i], margin: 0, fit: 'shrink' });
    s.addText(p[1], { x: 8.35, y: 1.84 + i * 1.22, w: 3.05, h: 0.28, fontSize: 9.4, color: C.ink, margin: 0, fit: 'shrink' });
  });
  footer(s, 10);
}

function snapshots() {
  const s = pptx.addSlide(); addBg(s); title(s, 'MVP snapshots', 'live and code-verified states');
  const img = path.join(assetDir, 'deployed-landing.png');
  if (fs.existsSync(img)) {
    card(s, 0.7, 1.65, 5.05, 3.85, { fill: '0E1422', line: '26314A', shadow: true });
    s.addImage({ path: img, x: 0.88, y: 1.9, w: 4.68, h: 3.15, sizingCrop: true });
    s.addText('Deployed landing page', { x: 0.9, y: 5.18, w: 4.4, h: 0.18, fontSize: 9.5, color: C.muted, margin: 0 });
  }
  card(s, 6.15, 1.65, 2.85, 1.55, { fill: '101522', line: '2A3853' });
  s.addText('Voice Report', { x: 6.38, y: 1.92, w: 1.6, h: 0.18, fontSize: 10.5, bold: true, color: C.white, margin: 0 });
  pill(s, 'Hindi', 7.72, 1.86, 0.72, C.green);
  for (let i=0;i<14;i++) s.addShape(pptx.ShapeType.rect, { x: 6.55+i*0.12, y: 2.72 - (i%5)*0.08, w: 0.04, h: 0.22+(i%5)*0.08, fill: { color: C.red, transparency: 20 }, line: { color: C.red, transparency: 100 } });
  s.addText('AI extracts English description + urgency', { x: 6.38, y: 2.82, w: 2.1, h: 0.15, fontSize: 7.8, color: C.muted, margin: 0, fit: 'shrink' });
  card(s, 9.35, 1.65, 2.85, 1.55, { fill: '101522', line: '2A3853' });
  s.addText('Priority Board', { x: 9.58, y: 1.92, w: 1.6, h: 0.18, fontSize: 10.5, bold: true, color: C.white, margin: 0 });
  pill(s, 'AI 92%', 10.82, 1.86, 0.82, C.green);
  ['HIGH Medical','MED Food','LOW Infra'].forEach((t,i)=>{ card(s,9.58,2.32+i*0.27,2.1,0.18,{fill:'151D2D',line:'2A3853'}); s.addText(t,{x:9.68,y:2.36+i*0.27,w:1.7,h:0.07,fontSize:5.8,color:i===0?C.red:i===1?C.yellow:C.green,margin:0,fit:'shrink'}); });
  card(s, 6.15, 3.68, 6.05, 1.82, { fill: '211214', line: '7A2D35' });
  s.addText('Possible Duplicate Detected', { x: 6.42, y: 4.02, w: 2.9, h: 0.22, fontSize: 13, bold: true, color: 'FFBAC2', margin: 0 });
  s.addText('AI compares the new report to open Firestore needs and asks the coordinator to cancel, create anyway, or link related reports.', { x: 6.42, y: 4.45, w: 5.15, h: 0.36, fontSize: 10.2, color: C.ink, margin: 0, fit: 'shrink' });
  pill(s, 'Create Anyway', 6.42, 5.02, 1.25, C.yellow);
  pill(s, 'Cancel', 7.9, 5.02, 0.78, C.red);
  s.addText('Note: internal dashboard screenshots are represented as editable states because the deployed app requires Google sign-in.', { x: 0.85, y: 6.28, w: 10.8, h: 0.22, fontSize: 8.4, color: '697487', margin: 0, fit: 'shrink' });
  footer(s, 11);
}

function future() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Additional details / future development', 'roadmap');
  const road = [
    ['v1.1', 'Hardening', 'Move direct fallback off in production; enforce Cloud Functions + Secret Manager for all Gemini calls.'],
    ['v1.2', 'Offline-first PWA', 'Cache reports locally and sync when rural field workers reconnect.'],
    ['v1.3', 'WhatsApp intake', 'Accept citizen/field-worker voice notes and route them through the same Gemini pipeline.'],
    ['v2.0', 'Predictive resource mapping', 'Use historical Firestore trends to anticipate shortages and surge needs.'],
  ];
  road.forEach((r, i) => {
    const y = 1.72 + i * 1.02;
    s.addText(r[0], { x: 0.95, y, w: 0.8, h: 0.22, fontSize: 12, bold: true, color: [C.blue,C.green,C.yellow,C.red][i], margin: 0 });
    s.addText(r[1], { x: 2.0, y, w: 2.35, h: 0.23, fontSize: 13.5, bold: true, color: C.white, margin: 0, fit: 'shrink' });
    s.addText(r[2], { x: 4.55, y: y - 0.02, w: 6.9, h: 0.27, fontSize: 11.2, color: C.ink, margin: 0, fit: 'shrink' });
  });
  footer(s, 12);
}

function links() {
  const s = pptx.addSlide(); addBg(s); title(s, 'Links', 'prototype access');
  const links = [
    ['MVP / Working Prototype', 'https://smart-resource-allocatio-3e4d2.web.app', 'https://smart-resource-allocatio-3e4d2.web.app'],
    ['GitHub Public Repository', 'Add public repo URL before final submission', ''],
    ['Demo Video Link', 'Add YouTube unlisted link before final submission', ''],
  ];
  links.forEach((l, i) => {
    card(s, 1.05, 1.85 + i * 1.25, 10.9, 0.82, { fill: '0E1422', line: '26314A' });
    s.addText(l[0], { x: 1.42, y: 2.1 + i * 1.25, w: 2.55, h: 0.18, fontSize: 11, bold: true, color: [C.green,C.blue,C.red][i], margin: 0, fit: 'shrink' });
    s.addText(l[1], { x: 4.35, y: 2.08 + i * 1.25, w: 6.7, h: 0.2, fontSize: 11.5, color: i === 0 ? C.cyan : C.ink, margin: 0, fit: 'shrink', hyperlink: l[2] ? { url: l[2] } : undefined });
  });
  s.addText('Submission reminder: replace the two placeholders after your GitHub repo is public and the 3-minute demo video is uploaded.', { x: 1.08, y: 6.04, w: 10.4, h: 0.25, fontSize: 11.5, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
  footer(s, 13);
}

cover(); team(); solution(); opportunities(); features(); processFlow(); wireframes(); architecture(); tech(); cost(); snapshots(); future(); links();

pptx.writeFile({ fileName: path.join(outDir, 'AidFlow_Google_Solution_Challenge_2026.pptx') });
