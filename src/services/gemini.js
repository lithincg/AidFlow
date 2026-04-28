import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

// ── Cloud Function wrappers ───────────────────────────
// These call the secure server-side Cloud Functions instead of
// hitting the Gemini API directly from the client. The API key
// is stored in Google Cloud Secret Manager, never in the browser.

// Fallback: If Cloud Functions are not deployed yet, use direct API.
// Set this to false once you've deployed the Cloud Functions.
const USE_CLOUD_FUNCTIONS = false;

// ── Direct API fallback (for development only) ────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`
  : null;

const VALID_URGENCY = ['HIGH', 'MEDIUM', 'LOW'];
const VALID_NEED_TYPE = ['Medical', 'Food', 'Safety', 'Infrastructure', 'Other'];
const VALID_CONFIDENCE = ['high', 'medium', 'low'];

function parseGeminiJSON(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

function normalizeClassification(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.urgency) {
    const upper = String(data.urgency).toUpperCase();
    data.urgency = VALID_URGENCY.includes(upper) ? upper : 'MEDIUM';
  }
  if (data.needType) {
    const matched = VALID_NEED_TYPE.find(
      (t) => t.toLowerCase() === String(data.needType).toLowerCase()
    );
    data.needType = matched || 'Other';
  }
  if (data.confidence) {
    const lower = String(data.confidence).toLowerCase();
    data.confidence = VALID_CONFIDENCE.includes(lower) ? lower : 'medium';
  }
  return data;
}

async function callGeminiDirect(body, retries = 1) {
  if (!GEMINI_URL) throw new Error('Gemini API key not configured');
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error ${response.status}: ${errorData?.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return parseGeminiJSON(text);
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// ── Call 1: Classify a text-based need ────────────────

export async function classifyNeed({ location, description, affectedGroup, fewShotBlock = '' }) {
  if (USE_CLOUD_FUNCTIONS) {
    const fn = httpsCallable(functions, 'classifyNeed');
    const result = await fn({ location, description, affectedGroup });
    return normalizeClassification(result.data);
  }

  // Direct API fallback
  const prompt = `You are a community crisis analyst working for an NGO coordination platform in India.
Your job is to analyze field reports and classify their urgency accurately.
Be especially sensitive to reports involving elderly people, children, medical emergencies,
or lack of basic necessities (food, water, shelter, medicine).
Always return ONLY valid JSON. No preamble, no explanation, no markdown formatting.

Analyze this community need report and return a JSON object:

Location: ${location}
Problem: ${description}
Affected Group: ${affectedGroup}

Return this exact JSON structure:
{
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "needType": "Medical" | "Food" | "Safety" | "Infrastructure" | "Other",
  "reason": "One sentence explaining the urgency classification",
  "confidence": "high" | "medium" | "low",
  "volunteersNeeded": <integer, estimated number of volunteers needed to address this need, minimum 1>
}

Rules:
- HIGH = immediate risk to life, health, or safety; vulnerable people without basics
- MEDIUM = significant need but not immediately life-threatening
- LOW = quality of life improvement, non-urgent infrastructure
- volunteersNeeded: consider the scale of the problem, affected group size, type of work required. A single medical delivery may need 1, a food distribution for 500 people may need 5-10.${fewShotBlock}`;

  const result = await callGeminiDirect({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1 },
  });
  const normalized = normalizeClassification(result);
  // Ensure volunteersNeeded is a valid integer
  normalized.volunteersNeeded = Math.max(1, parseInt(normalized.volunteersNeeded) || 1);
  return normalized;
}

// ── Call 2: OCR + classify from image ─────────────────

export async function extractAndClassifyFromImage(base64ImageData, mimeType) {
  if (USE_CLOUD_FUNCTIONS) {
    const fn = httpsCallable(functions, 'extractAndClassifyFromImage');
    const result = await fn({ base64ImageData, mimeType });
    return normalizeClassification(result.data);
  }

  // Direct API fallback
  const prompt = `You are a community crisis analyst with OCR capabilities.
You read field report images and survey forms from NGO field workers in India.
Handwriting can be messy. Text may be in English, Hindi, Kannada, Telugu, or a mix.
Do your best to read everything. Always return ONLY valid JSON. No preamble, no markdown.

This is a photograph of a community field report or survey form.
Read all text visible in this image carefully.
Extract the information and classify the need.

Return this exact JSON structure:
{
  "location": "extracted location or 'Not found'",
  "description": "extracted problem description or summary of what you read",
  "affectedGroup": "who is affected, extracted or inferred",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "needType": "Medical" | "Food" | "Safety" | "Infrastructure" | "Other",
  "reason": "One sentence explaining the urgency classification",
  "confidence": "high" | "medium" | "low",
  "unreadParts": "Describe any parts of the image you could not read clearly, or null if everything was clear",
  "rawTextExtracted": "All text you could read from the image, verbatim"
}

Rules for urgency:
- HIGH = immediate risk to life, health, or safety; vulnerable people without basics
- MEDIUM = significant need but not immediately life-threatening
- LOW = quality of life improvement, non-urgent

If this image is not a field report or does not contain community need information, return:
{ "error": "Image does not appear to be a field report" }`;

  const result = await callGeminiDirect({
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64ImageData } },
        ],
      },
    ],
    generationConfig: { temperature: 0.1 },
  });
  return normalizeClassification(result);
}

// ── Call 3: Rank volunteers for a specific need ──────

export async function rankVolunteersForNeed({ need, freeVolunteers }) {
  if (!freeVolunteers || freeVolunteers.length === 0) {
    return { rankedVolunteerIds: [], reasoning: 'No free volunteers available.', confidence: 'low' };
  }

  const volunteersList = freeVolunteers
    .map(
      (v) =>
        `${v.id} | ${v.name} | Skills: ${(v.skills || []).join(', ')} | Zone: ${v.zone} | Tasks completed: ${v.tasksCompleted || 0}`
    )
    .join('\n');

  const prompt = `You are a volunteer dispatch coordinator for an NGO in India.
Your job is to rank available volunteers by how well they match a specific community need.
Consider: skill relevance, geographic proximity (zone match), experience (tasks completed), and need type.
Always return ONLY valid JSON. No preamble, no markdown.

Community Need:
Location: ${need.location}
Type: ${need.needType}
Urgency: ${need.urgency}
Description: ${need.description}
Affected Group: ${need.affectedGroup || 'Not specified'}
Volunteers Needed: ${need.volunteersNeeded || 1}

Available Free Volunteers:
${volunteersList}

(Each volunteer is formatted as: ID | Name | Skills | Zone | Tasks Completed)

Return this exact JSON:
{
  "rankedVolunteerIds": ["best_match_id", "second_best_id", ...],
  "reasoning": "2-3 sentences explaining the ranking logic",
  "confidence": "high" | "medium" | "low"
}

Rules:
- Rank ALL volunteers, best match first
- Consider skill relevance as the primary factor
- Geographic proximity (same zone/city) as secondary factor
- Experience (higher tasksCompleted) as tiebreaker
- Include ALL volunteer IDs in the ranked list, even poor matches`;

  if (USE_CLOUD_FUNCTIONS) {
    const fn = httpsCallable(functions, 'rankVolunteersForNeed');
    const result = await fn({ need, freeVolunteers });
    return result.data;
  }

  return callGeminiDirect({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  });
}

// ── Legacy: Match volunteer to need (kept for backward compat) ──

export async function matchVolunteerToNeed({
  volunteerName,
  skills,
  zone,
  openNeeds,
}) {
  if (USE_CLOUD_FUNCTIONS) {
    const fn = httpsCallable(functions, 'matchVolunteerToNeed');
    const result = await fn({ volunteerName, skills, zone, openNeeds });
    return result.data;
  }

  const needsList = openNeeds
    .map(
      (n) =>
        `${n.id} | ${n.location} | ${n.needType} | ${n.description} | ${n.status}`
    )
    .join('\n');

  const prompt = `You are a volunteer dispatch coordinator for an NGO.
Match this volunteer to the most appropriate urgent community need.
Always return ONLY valid JSON. No preamble, no markdown.

Volunteer: ${volunteerName} | Skills: ${skills} | Zone: ${zone}

Open Needs:
${needsList}

Return JSON:
{
  "recommendedNeedId": "the need ID",
  "recommendedNeedSummary": "brief description",
  "reason": "2 sentences why this is the best match",
  "alternativeNeedId": "second best or null",
  "confidence": "high" | "medium" | "low",
  "caveat": "important note or null"
}`;

  return callGeminiDirect({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  });
}

// ── Call 5: Check for duplicate / related needs ──────

export async function checkDuplicateNeeds({ newNeed, existingNeeds }) {
  if (!existingNeeds || existingNeeds.length === 0) {
    return { isDuplicate: false, relatedNeedIds: [], mergeRecommendation: null, confidence: 'high' };
  }

  // Cap at 20 needs to avoid token overflow: prioritize same-location, then most recent
  let capped = existingNeeds;
  if (existingNeeds.length > 20) {
    const newLoc = (newNeed.location || '').toLowerCase();
    const sameLocation = existingNeeds.filter(
      (n) => (n.location || '').toLowerCase().includes(newLoc) || newLoc.includes((n.location || '').toLowerCase())
    );
    const rest = existingNeeds
      .filter((n) => !sameLocation.includes(n))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    capped = [...sameLocation, ...rest].slice(0, 20);
  }

  const needsList = capped
    .map(
      (n) =>
        `${n.id} | ${n.location} | ${n.needType} | ${n.description} | Status: ${n.status}`
    )
    .join('\n');

  const prompt = `You are a crisis report analyst specializing in deduplication for an NGO platform.
During disasters, the same incident is often reported multiple times by different people.
Your job is to determine if a NEW report describes the same crisis as any EXISTING reports.
Always return ONLY valid JSON. No preamble, no markdown.

NEW REPORT being submitted:
Location: ${newNeed.location}
Description: ${newNeed.description}
Affected Group: ${newNeed.affectedGroup || 'Not specified'}
Type: ${newNeed.needType || 'Unknown'}

EXISTING OPEN REPORTS in this organization:
${needsList}

(Each existing report is formatted as: ID | Location | Type | Description | Status)

Analyze the NEW report against ALL existing reports and determine:
1. Is this new report describing the SAME incident as any existing report?
2. Is it RELATED but not identical (e.g., different aspect of the same crisis)?
3. Is it completely unique?

Return this exact JSON:
{
  "isDuplicate": true | false,
  "relatedNeedIds": ["id1", "id2"],
  "relationship": "duplicate" | "related" | "unique",
  "mergeRecommendation": "1-2 sentences explaining why these are related and what to do. null if unique.",
  "combinedVolunteersNeeded": <integer or null — if merging, how many total volunteers needed>,
  "confidence": "high" | "medium" | "low"
}

Rules:
- "duplicate" = clearly the same incident described differently (same location + same problem)
- "related" = connected but distinct (e.g., bridge collapse + road blocked near same bridge)
- "unique" = no meaningful connection to existing reports
- Only flag as duplicate/related if you're reasonably confident. Don't over-flag.
- Return relatedNeedIds as an empty array if unique.`;

  return callGeminiDirect({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1 },
  });
}

// ── Call 6: Classify a voice-transcribed report ──────

export async function classifyVoiceReport({ transcript, fewShotBlock = '' }) {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Empty transcript');
  }

  const prompt = `You are a crisis report analyst for an NGO coordination platform in India.
A field worker has just spoken a crisis report into their phone. The speech has been transcribed.
The transcription may be:
- In English, Hindi, Kannada, Telugu, Marathi, or a MIX of languages
- Informal, fragmented, or emotional
- Contain filler words, repetitions, or corrections

Your job is to extract structured information and classify the urgency.
Always return ONLY valid JSON. No preamble, no markdown.

SPOKEN TRANSCRIPT:
"${transcript}"

Extract all information and return this exact JSON structure:
{
  "language": "English" | "Hindi" | "Kannada" | "Telugu" | "Marathi" | "Mixed",
  "location": "extracted location or 'Not specified'",
  "description": "cleaned up, coherent crisis description in English",
  "affectedGroup": "who is affected, extracted or inferred",
  "reporterName": "if the speaker mentions their name, otherwise null",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "needType": "Medical" | "Food" | "Safety" | "Infrastructure" | "Other",
  "reason": "One sentence explaining the urgency classification",
  "confidence": "high" | "medium" | "low",
  "volunteersNeeded": <integer, minimum 1>,
  "originalTranscript": "the raw transcript exactly as provided"
}

Rules:
- HIGH = immediate risk to life, health, or safety; vulnerable people without basics
- MEDIUM = significant need but not immediately life-threatening
- LOW = quality of life improvement, non-urgent
- Translate any non-English content into English for the description field
- Keep the originalTranscript exactly as spoken
- If the transcript is too vague to classify, set confidence to "low"${fewShotBlock}`;

  const result = await callGeminiDirect({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1 },
  });
  const normalized = normalizeClassification(result);
  normalized.volunteersNeeded = Math.max(1, parseInt(normalized.volunteersNeeded) || 1);
  return normalized;
}
