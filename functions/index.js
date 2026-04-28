const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const GEMINI_MODEL = 'gemini-flash-latest';
const VALID_URGENCY = ['HIGH', 'MEDIUM', 'LOW'];
const VALID_NEED_TYPE = ['Medical', 'Food', 'Safety', 'Infrastructure', 'Other'];
const VALID_CONFIDENCE = ['high', 'medium', 'low'];

// ── Helpers ────────────────────────────────────────────

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
    const matched = VALID_NEED_TYPE.find(t => t.toLowerCase() === String(data.needType).toLowerCase());
    data.needType = matched || 'Other';
  }
  if (data.confidence) {
    const lower = String(data.confidence).toLowerCase();
    data.confidence = VALID_CONFIDENCE.includes(lower) ? lower : 'medium';
  }
  return data;
}

async function callGeminiAPI(apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error ${response.status}: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return parseGeminiJSON(text);
}

// ── Call 1: Classify a text-based need ────────────────

exports.classifyNeed = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { location, description, affectedGroup } = request.data;
    if (!description) {
      throw new HttpsError('invalid-argument', 'Description is required.');
    }

    const prompt = `You are a community crisis analyst working for an NGO coordination platform in India.
Your job is to analyze field reports and classify their urgency accurately.
Be especially sensitive to reports involving elderly people, children, medical emergencies,
or lack of basic necessities (food, water, shelter, medicine).
Always return ONLY valid JSON. No preamble, no explanation, no markdown formatting.

Analyze this community need report and return a JSON object:

Location: ${location || 'Unknown'}
Problem: ${description}
Affected Group: ${affectedGroup || 'Unknown'}

Return this exact JSON structure:
{
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "needType": "Medical" | "Food" | "Safety" | "Infrastructure" | "Other",
  "reason": "One sentence explaining the urgency classification",
  "confidence": "high" | "medium" | "low"
}

Rules:
- HIGH = immediate risk to life, health, or safety; vulnerable people without basics
- MEDIUM = significant need but not immediately life-threatening
- LOW = quality of life improvement, non-urgent infrastructure`;

    try {
      const result = await callGeminiAPI(geminiApiKey.value(), {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      });
      return normalizeClassification(result);
    } catch (err) {
      console.error('classifyNeed error:', err);
      throw new HttpsError('internal', 'Failed to classify need.');
    }
  }
);

// ── Call 2: OCR + classify from image ─────────────────

exports.extractAndClassifyFromImage = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { base64ImageData, mimeType } = request.data;
    if (!base64ImageData || !mimeType) {
      throw new HttpsError('invalid-argument', 'Image data and MIME type are required.');
    }

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

    try {
      const result = await callGeminiAPI(geminiApiKey.value(), {
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
    } catch (err) {
      console.error('extractAndClassifyFromImage error:', err);
      throw new HttpsError('internal', 'Failed to process image.');
    }
  }
);

// ── Call 3: Match volunteer to need ───────────────────

exports.matchVolunteerToNeed = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { volunteerName, skills, zone, openNeeds } = request.data;
    if (!volunteerName || !skills || !openNeeds) {
      throw new HttpsError('invalid-argument', 'Volunteer info and open needs are required.');
    }

    const needsList = openNeeds
      .map((n) => `${n.id} | ${n.location} | ${n.needType} | ${n.description} | ${n.status}`)
      .join('\n');

    const prompt = `You are a volunteer dispatch coordinator for an NGO.
Your job is to match volunteers to the most appropriate urgent community need.
Consider: skill relevance, geographic proximity (zone match), and need severity.
Prioritize HIGH urgency needs. Always return ONLY valid JSON. No preamble, no markdown.

Volunteer Profile:
Name: ${volunteerName}
Skills: ${skills}
Available Zone: ${zone}

Open HIGH Priority Needs:
${needsList}

(Each need is formatted as: ID | Location | Type | Description | Current Status)

Return this exact JSON:
{
  "recommendedNeedId": "the need ID from the list above",
  "recommendedNeedSummary": "brief description of the recommended need",
  "reason": "2 sentences: why this volunteer is the best match for this need",
  "alternativeNeedId": "second best option ID, or null if only one option",
  "confidence": "high" | "medium" | "low",
  "caveat": "Any important note about this assignment, or null"
}

If there are no open needs that match this volunteer's skills or zone, return:
{
  "recommendedNeedId": null,
  "reason": "Explain why no suitable match was found",
  "suggestion": "What type of need this volunteer should be saved for"
}`;

    try {
      const result = await callGeminiAPI(geminiApiKey.value(), {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      });
      return result;
    } catch (err) {
      console.error('matchVolunteerToNeed error:', err);
      throw new HttpsError('internal', 'Failed to match volunteer.');
    }
  }
);
