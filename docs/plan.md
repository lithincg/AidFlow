# AIDFLOW — FULL BUILD PLAN
### Data-Driven Volunteer Coordination for Social Impact
**Competition: SC 2026 Built with AI (AntiGravity)**
**Stack: Google AI Studio (Gemini API) + Firebase + React**

---

## 📌 INSTRUCTIONS FOR AI READING THIS DOCUMENT

This document is a complete specification for building a working prototype of the AidFlow app. It is written to be read and implemented by an AI coding assistant (Google AI Studio / Gemini via AntiGravity).

**If you are Claude Opus reviewing this plan:**
- Identify any architectural gaps, logical flaws, or missing edge cases
- Upgrade the AI prompts to be more robust and accurate
- Suggest any structural improvements to the Firebase schema
- Validate the build order and flag any sequencing issues
- Add anything that would make this more impressive to competition judges
- Leave your review notes at the bottom of this document under a section called `## OPUS REVIEW NOTES`

**If you are Gemini implementing this plan:**
- Follow the build order exactly — do not skip steps
- Build one section at a time and test before moving to the next
- All code should be written in React with Tailwind CSS
- Reference the prompts section exactly — do not rewrite the AI prompts
- Ask for clarification before making any architectural decisions not covered here

---

## 1. PROBLEM STATEMENT

Local social groups and NGOs collect critical information about community needs through paper surveys, WhatsApp messages, and field reports. This data is scattered across different people, formats, and locations — making it nearly impossible for coordinators to see the full picture of what needs urgent attention.

At the same time, volunteers are assigned based on who is available, not who is best suited — leading to mismatches, burnout, and unaddressed needs.

**Core pain:**
- No unified view of community needs
- No urgency prioritization system
- No intelligent volunteer-to-task matching
- No real-time operational visibility

---

## 2. SOLUTION OVERVIEW

A lightweight web app that:
1. Accepts community need reports (typed OR photo of paper form / WhatsApp screenshot)
2. Uses Gemini AI to extract, classify, and prioritize each need automatically
3. Displays a live priority board for the coordinator
4. Matches available volunteers to the highest-priority open needs using AI
5. Tracks assignment status through to resolution

**The core innovation:** A coordinator or field worker can photograph a handwritten paper form and the system reads it, classifies the urgency, and adds it to the live board — no manual data entry required.

---

## 3. TECH STACK

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + Tailwind CSS | Fast to build, easy to style |
| AI | Gemini 1.5 Flash (via Google AI Studio API) | Vision + text in one call, free tier generous |
| Database | Firebase Firestore | Real-time, no backend needed |
| Image Storage | Firebase Storage | Store uploaded form photos |
| Hosting | Firebase Hosting | One-click deploy |
| Auth | Firebase Anonymous Auth | No login friction for demo |

**Google AI Studio API Base URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

**Model to use:** `gemini-1.5-flash` for all calls (fast, vision-capable, free tier)

---

## 4. FEATURES (SCOPE — EXACTLY 4, NO MORE)

### Feature 1: Text-Based Need Submission
A simple form where anyone types a community need report.
Fields: Location, Problem Description, Affected Group, Reporter Name (optional)
On submit: Gemini classifies urgency + need type → saved to Firestore

### Feature 2: OCR Photo Submission (the differentiator)
Upload or photograph a paper field report or WhatsApp screenshot.
Gemini Vision reads the image, extracts all fields, classifies urgency.
Coordinator reviews the auto-extracted data and confirms with one click.

### Feature 3: Live Priority Needs Board
Real-time Firestore listener shows all open needs sorted by urgency (HIGH first).
Each card shows: urgency badge, need type, location, description, AI reason, time submitted, status.
Coordinator can mark needs as In Progress or Resolved.

### Feature 4: AI Volunteer Match
Coordinator enters a volunteer's name, skills (comma-separated), and zone.
Gemini compares the volunteer profile against all open HIGH priority needs.
Returns the single best assignment recommendation with reasoning.
Coordinator clicks Confirm → need is marked Assigned with volunteer name attached.

---

## 5. FIREBASE DATA SCHEMA

### Collection: `needs`
```
/needs/{needId} {
  id: string (auto),
  source: "text" | "ocr",
  rawImageUrl: string | null,       // Firebase Storage URL if OCR
  location: string,
  description: string,
  affectedGroup: string,
  reporterName: string | null,
  urgency: "HIGH" | "MEDIUM" | "LOW",
  needType: "Medical" | "Food" | "Safety" | "Infrastructure" | "Other",
  aiReason: string,
  aiConfidence: "high" | "medium" | "low",
  aiUnreadParts: string | null,     // Only for OCR — what Gemini couldn't read
  status: "open" | "assigned" | "in_progress" | "resolved",
  assignedVolunteer: string | null,
  assignmentReason: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `volunteers`
```
/volunteers/{volunteerId} {
  id: string (auto),
  name: string,
  skills: string[],                 // Array of skill strings
  zone: string,
  assignedNeedId: string | null,
  createdAt: timestamp
}
```

### Collection: `assignments`
```
/assignments/{assignmentId} {
  id: string (auto),
  volunteerId: string,
  volunteerName: string,
  needId: string,
  needSummary: string,
  aiReason: string,
  assignedAt: timestamp,
  status: "active" | "completed"
}
```

---

## 6. AI PROMPTS — USE EXACTLY AS WRITTEN

### Prompt 1: Text Need Classification
**Used when:** User submits a need via the text form
**Model:** gemini-1.5-flash
**Input type:** Text only

```
SYSTEM:
You are a community crisis analyst working for an NGO coordination platform in India. 
Your job is to analyze field reports and classify their urgency accurately.
Be especially sensitive to reports involving elderly people, children, medical emergencies, 
or lack of basic necessities (food, water, shelter, medicine).
Always return ONLY valid JSON. No preamble, no explanation, no markdown formatting.

USER:
Analyze this community need report and return a JSON object:

Location: {location}
Problem: {description}  
Affected Group: {affectedGroup}

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
- LOW = quality of life improvement, non-urgent infrastructure
```

### Prompt 2: OCR + Classification (Vision)
**Used when:** User uploads a photo of a field report or WhatsApp screenshot
**Model:** gemini-1.5-flash (vision)
**Input type:** Image + Text

```
SYSTEM:
You are a community crisis analyst with OCR capabilities. 
You read field report images and survey forms from NGO field workers in India.
Handwriting can be messy. Text may be in English, Hindi, Kannada, Telugu, or a mix.
Do your best to read everything. Always return ONLY valid JSON. No preamble, no markdown.

USER:
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
{ "error": "Image does not appear to be a field report" }
```

### Prompt 3: Volunteer Matching
**Used when:** Coordinator submits a volunteer profile for matching
**Model:** gemini-1.5-flash
**Input type:** Text only

```
SYSTEM:
You are a volunteer dispatch coordinator for an NGO. 
Your job is to match volunteers to the most appropriate urgent community need.
Consider: skill relevance, geographic proximity (zone match), and need severity.
Prioritize HIGH urgency needs. Always return ONLY valid JSON. No preamble, no markdown.

USER:
Volunteer Profile:
Name: {volunteerName}
Skills: {skills}
Available Zone: {zone}

Open HIGH Priority Needs:
{needsList}

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
}
```

---

## 7. FULL APPLICATION STRUCTURE

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx           // App name, nav tabs, status bar
│   │   └── StatusBar.jsx        // Live count: X open needs, Y volunteers ready
│   ├── NeedSubmission/
│   │   ├── TextSubmitForm.jsx   // Manual text entry form
│   │   ├── OCRUpload.jsx        // Image upload + preview + Gemini call
│   │   └── OCRReviewCard.jsx    // Show extracted data, let user edit, confirm
│   ├── PriorityBoard/
│   │   ├── NeedsBoard.jsx       // Main board with real-time Firestore listener
│   │   ├── NeedCard.jsx         // Individual need card with urgency badge
│   │   └── UrgencyBadge.jsx     // HIGH/MEDIUM/LOW colored badge component
│   ├── VolunteerMatch/
│   │   ├── VolunteerForm.jsx    // Enter volunteer profile
│   │   └── MatchResult.jsx      // Show AI recommendation, confirm button
│   └── common/
│       ├── LoadingSpinner.jsx
│       ├── ErrorMessage.jsx
│       └── ConfirmModal.jsx
├── services/
│   ├── gemini.js                // All Gemini API calls (3 functions)
│   ├── firebase.js              // Firebase init + config
│   └── firestore.js             // All Firestore CRUD operations
├── hooks/
│   ├── useNeeds.js              // Real-time listener for needs collection
│   └── useVolunteers.js         // Volunteer state management
├── utils/
│   ├── imageToBase64.js         // Convert uploaded image to base64 for Gemini
│   └── formatNeeds.js           // Format needs list for Prompt 3
├── App.jsx                      // Main app, tab navigation
├── main.jsx
└── index.css
```

---

## 8. GEMINI API SERVICE — gemini.js

```javascript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper: parse JSON safely from Gemini response
function parseGeminiJSON(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// Call 1: Classify a text-based need
export async function classifyNeed({ location, description, affectedGroup }) {
  const prompt = `...` // Use Prompt 1 from Section 6, fill in variables
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }  // Low temp for consistent JSON
    })
  });
  const data = await response.json();
  return parseGeminiJSON(data.candidates[0].content.parts[0].text);
}

// Call 2: OCR + classify from image
export async function extractAndClassifyFromImage(base64ImageData, mimeType) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `...` },   // Use Prompt 2 system + user text from Section 6
          { inline_data: { mime_type: mimeType, data: base64ImageData } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    })
  });
  const data = await response.json();
  return parseGeminiJSON(data.candidates[0].content.parts[0].text);
}

// Call 3: Match volunteer to need
export async function matchVolunteerToNeed({ volunteerName, skills, zone, openNeeds }) {
  const needsList = openNeeds.map(n =>
    `${n.id} | ${n.location} | ${n.needType} | ${n.description} | ${n.status}`
  ).join('\n');
  const prompt = `...` // Use Prompt 3 from Section 6, fill in variables
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });
  const data = await response.json();
  return parseGeminiJSON(data.candidates[0].content.parts[0].text);
}
```

---

## 9. FIRESTORE SERVICE — firestore.js

```javascript
// Functions needed:
// addNeed(needData) → returns docId
// getAllNeeds() → returns needs array (for one-time fetch)
// subscribeToNeeds(callback) → real-time listener, returns unsubscribe fn
// updateNeedStatus(needId, status, extraData = {}) → updates status + any extra fields
// addVolunteer(volunteerData) → returns docId  
// addAssignment(assignmentData) → returns docId
// getOpenHighPriorityNeeds() → returns only HIGH urgency, open status needs
```

---

## 10. UI DESIGN SPECIFICATION

**Color Palette:**
```css
--urgent-high: #EF4444    /* Red */
--urgent-medium: #F97316  /* Orange */
--urgent-low: #22C55E     /* Green */
--assigned: #3B82F6       /* Blue */
--resolved: #6B7280       /* Gray */
--bg-primary: #0F172A     /* Deep navy - dark mode */
--bg-card: #1E293B        /* Slate card */
--text-primary: #F1F5F9
--text-secondary: #94A3B8
--accent: #38BDF8         /* Sky blue accent */
```

**Layout:** Dark mode, 3-tab navigation at top
- Tab 1: 📋 Submit Need (has two sub-tabs: Type / Scan Photo)
- Tab 2: 🔴 Priority Board (default tab)
- Tab 3: 🤝 Match Volunteer

**Need Card design:**
- Left border color = urgency color
- Top right: urgency badge (HIGH/MEDIUM/LOW) + need type pill
- Body: location (bold), description (truncated to 2 lines), affected group
- Footer: AI reason (italic, smaller), time ago, status badge, action buttons
- HIGH urgency cards have subtle pulsing border animation

**OCR Flow UI:**
- Drag-and-drop zone OR camera button
- Image preview shown immediately after upload
- Loading state: "Reading your field report..." with spinner
- Result shown as editable card — user can fix any field before confirming
- Confidence indicator shown if low ("AI wasn't fully confident — please verify")
- If unread parts detected, highlight with warning icon

---

## 11. STEP-BY-STEP BUILD ORDER

Follow this order exactly. Test each step before moving forward.

### PHASE 1: Foundation (Start Here)
**Step 1.1** — Set up Vite + React project
```bash
npm create vite@latest smart-resource-allocation -- --template react
cd smart-resource-allocation
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install firebase
```

**Step 1.2** — Set up Firebase project
- Create Firebase project at console.firebase.google.com
- Enable Firestore (production mode, then update rules to allow read/write for now)
- Enable Firebase Storage
- Enable Anonymous Auth
- Copy config to `.env` file:
```
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Step 1.3** — Create `src/services/firebase.js` with Firebase init
**Step 1.4** — Create `src/services/firestore.js` with all CRUD functions
**Step 1.5** — Create `src/services/gemini.js` with all 3 API functions
**Step 1.6** — TEST: Call `classifyNeed()` from browser console with test data. Confirm JSON response.

---

### PHASE 2: Need Submission (Text)
**Step 2.1** — Build `TextSubmitForm.jsx`
  - Fields: Location, Description (textarea), Affected Group, Reporter Name (optional)
  - Submit button triggers `classifyNeed()` then `addNeed()` to Firestore
  - Loading state during API call
  - Success state: show what AI classified it as, then clear form

**Step 2.2** — TEST: Submit 3-4 different needs. Check Firestore console to confirm they appear with correct urgency classifications.

---

### PHASE 3: Priority Board
**Step 3.1** — Build `useNeeds.js` hook with real-time Firestore listener
**Step 3.2** — Build `UrgencyBadge.jsx` component
**Step 3.3** — Build `NeedCard.jsx` with all fields + action buttons
**Step 3.4** — Build `NeedsBoard.jsx` — fetches needs, sorts HIGH first, renders cards
  - Status filter buttons at top: All / Open / Assigned / Resolved
  - Count summary: "X High Priority · Y Total Open"
  - Empty state: "No open needs — all clear!" 

**Step 3.5** — Add status update buttons to NeedCard:
  - "Mark In Progress" → updates status in Firestore
  - "Mark Resolved" → updates status, grays out card
  
**Step 3.6** — TEST: Submit needs via text form, confirm they appear live on board. Update statuses. Confirm real-time update works.

---

### PHASE 4: OCR Photo Submission
**Step 4.1** — Build `src/utils/imageToBase64.js`
```javascript
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];  // Strip data:image/...;base64,
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Step 4.2** — Build `OCRUpload.jsx`
  - Drag-and-drop area + file input button + camera capture (accept="image/*;capture=camera")
  - Image preview renders immediately after selection
  - "Read Field Report" button triggers `imageToBase64()` then `extractAndClassifyFromImage()`
  - Upload image to Firebase Storage first, get URL, save with need

**Step 4.3** — Build `OCRReviewCard.jsx`
  - Shows all extracted fields as EDITABLE inputs (pre-filled with Gemini's output)
  - Shows confidence level and any unread parts warnings
  - "Confirm & Add to Board" button → calls `addNeed()` with source: "ocr"
  - "Try Again" button to re-upload

**Step 4.4** — TEST: Photograph a handwritten note with location + problem description. Run through OCR flow. Verify extraction accuracy. Test with a WhatsApp screenshot too.

---

### PHASE 5: Volunteer Matching
**Step 5.1** — Build `VolunteerForm.jsx`
  - Fields: Volunteer Name, Skills (comma-separated text input), Available Zone
  - Submit triggers `matchVolunteerToNeed()` with open HIGH needs from Firestore

**Step 5.2** — Build `MatchResult.jsx`
  - Shows recommended need card (highlighted)
  - Shows AI reasoning text
  - Shows alternative option if available
  - "Confirm Assignment" button → calls `addAssignment()`, updates need status to "assigned", updates need's assignedVolunteer field

**Step 5.3** — Build `src/utils/formatNeeds.js` — formats open HIGH needs list for Prompt 3
**Step 5.4** — TEST: Add some HIGH priority needs to board. Enter a volunteer. Verify AI recommends sensible match. Confirm assignment and verify board updates.

---

### PHASE 6: Polish + Tabs + Header
**Step 6.1** — Build `Header.jsx` with tab navigation
**Step 6.2** — Build `StatusBar.jsx` showing live counts from Firestore
**Step 6.3** — Wire all components into `App.jsx` with tab state
**Step 6.4** — Apply full color scheme from Section 10
**Step 6.5** — Add loading spinners, error states, and empty states everywhere
**Step 6.6** — Add HIGH urgency card pulse animation in CSS
**Step 6.7** — Deploy to Firebase Hosting:
```bash
npm run build
firebase init hosting
firebase deploy
```

---

## 12. ERROR HANDLING — IMPORTANT

### Gemini API Errors
Always wrap Gemini calls in try/catch. Handle these cases:
- API key invalid → show "AI service unavailable" message
- Response is not valid JSON → retry once, then show manual form fallback
- Network timeout → show retry button
- Image too large for vision API → compress before sending (max 4MB)

### Image Compression Before OCR
Before sending image to Gemini, compress if > 2MB:
```javascript
// Use canvas to resize/compress
function compressImage(file, maxSizeMB = 2) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Scale down if needed
        const maxDim = 2000;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

### OCR Low Confidence
If Gemini returns `confidence: "low"`:
- Show yellow warning banner: "AI had difficulty reading this image. Please review all fields carefully."
- All fields should remain fully editable
- Highlight any field where `unreadParts` mentions uncertainty

---

## 13. DEMO SCRIPT (For Presentation)

Practice this exact flow. This is what judges will see.

**Setup before demo:**
- Have 2-3 handwritten paper notes ready (prepared beforehand, good lighting)
- Note 1: "Ward 5, Dharwad. Three elderly residents (80+) with no food for 2 days. No family. Neighbours worried." — should classify HIGH, Food
- Note 2: "Main road near bus stand has large pothole causing accidents" — should classify MEDIUM, Infrastructure
- Note 3: "Child (7 yrs) with high fever, parents have no money for doctor, Hubli Ward 12" — should classify HIGH, Medical

**Demo flow (under 3 minutes):**

1. Open app → show the Priority Board (empty or with pre-existing needs)
2. Go to Submit → Scan Photo tab
3. Hold up Note 1, take photo with phone or upload
4. Show "Reading your field report..." loading state
5. Show extracted data auto-filled in review card
6. Click Confirm → **switch to Priority Board tab — need appears instantly as HIGH**
7. Scan Note 3 → show HIGH Medical appear on board
8. Scan Note 2 → show MEDIUM Infrastructure
9. Say: "In 60 seconds, 3 field reports — no typing"
10. Go to Match Volunteer tab
11. Enter: Name "Priya Sharma", Skills "First Aid, Nursing, Child Care", Zone "Hubli"
12. Show AI recommends the High Medical child fever case → explain why
13. Click Confirm Assignment → show board updates to "Assigned"
14. Closing line: "What used to take hours of phone calls and spreadsheets — done in under 2 minutes with AI"

---

## 14. JUDGING CRITERIA ALIGNMENT

Based on typical SC 2026 / hackathon criteria:

| Criteria | How This Project Addresses It |
|---|---|
| **AI Usage** | Gemini used for real reasoning — urgency classification, vision OCR, semantic volunteer matching — not just as a chatbot |
| **Real Problem** | NGO coordination is a genuine pain point in India, especially Tier 2/3 cities |
| **Working Prototype** | Full working app, not a mockup — live Firebase data, real API calls |
| **Innovation** | OCR-to-prioritization pipeline is novel; most NGO tools require manual data entry |
| **Impact Potential** | Directly reduces response time to urgent community needs; scalable to any city |
| **Technical Execution** | Three distinct Gemini prompt types (text classification, vision OCR, semantic matching) |

---

## 15. KNOWN CONSTRAINTS & TEAM CONTEXT



- **Team Size:** 2
- **Time Available:** 4-5   days
- **Team Skills:** assume nothing none but with help can figure things out unless complicated
- **Device for Demo:** demo on laptop but if use case demands for a mobile app can make mobile app but maybe showcase on laptop idk. some kind of presentation on laptop the actually apllication location on laptop or mobile depends on you
- **Internet Reliability at Venue:** stable
- **Language Considerations:** Field reports may be in [English / Kannada / Telugu / Hindi]
- **Gemini API Quota Limits:** idk i have google ai pro plan check online whats the limit is ??
- **Scope Risk:** If time is short, OCR is the first feature to cut back to text-only. The core value (AI prioritization + matching) survives without it.can try ocr later if possible(i do prefer it cz well is good init)

---

## 16. FUTURE SCOPE (V2 — Not for this submission)

- WhatsApp Business API integration (reports sent directly via WhatsApp)
- Geographic map view with need density heatmap
- Volunteer mobile app (PWA) for field status updates
- Multi-language support (Gemini handles this natively — just add instruction to prompts)
- SMS alerts for new HIGH priority needs (Firebase + Twilio)
- NGO admin dashboard with analytics
- Offline-first capability for low connectivity areas

---

## OPUS REVIEW NOTES
*(This section to be filled by Claude Opus)*

---

*Document Version: 1.0 | Built for SC 2026 Built with AI (AntiGravity)*
*Problem Track: AidFlow — Data-Driven Volunteer Coordination*