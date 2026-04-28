const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

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

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function toWavBuffer(pcmData, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = channels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

function buildPrompt(scriptText, style) {
  return [
    'Read the following product demo narration exactly as written.',
    'Do not add or remove words.',
    style || 'Use a natural, human, polished delivery with clear pacing and short pauses between paragraphs.',
    '',
    'Script:',
    scriptText.trim(),
  ].join('\n');
}

async function generateSpeech({ apiKey, model, voice, text, style }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildPrompt(text, style) }],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
      model,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS request failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const data = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) {
    throw new Error(`Gemini TTS response did not include audio data: ${JSON.stringify(json)}`);
  }
  return Buffer.from(data, 'base64');
}

async function main() {
  loadDotEnv(path.join(root, '.env'));
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or VITE_GEMINI_API_KEY in environment.');
  }

  const scriptPath = path.resolve(args.script || 'C:\\Users\\lithi\\GitHub\\demo\\product-demo-script.txt');
  const outputPath = path.resolve(args.out || 'C:\\Users\\lithi\\GitHub\\demo\\product-narration-gemini.wav');
  const model = args.model || 'gemini-3.1-flash-tts-preview';
  const voice = args.voice || 'Achird';
  const style = args.style || 'Sound like a calm Indian English male presenter speaking naturally for a polished product demo.';
  const previewParagraphs = Number(args.previewParagraphs || 0);

  let text = fs.readFileSync(scriptPath, 'utf8').trim();
  if (previewParagraphs > 0) {
    text = text
      .split(/\r?\n\r?\n/)
      .slice(0, previewParagraphs)
      .join('\n\n')
      .trim();
  }

  const pcm = await generateSpeech({ apiKey, model, voice, text, style });
  const wav = toWavBuffer(pcm);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, wav);

  const seconds = pcm.length / 2 / 24000;
  console.log(
    JSON.stringify(
      {
        outputPath,
        scriptPath,
        voice,
        model,
        seconds: Number(seconds.toFixed(2)),
        bytes: wav.length,
        previewParagraphs,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
