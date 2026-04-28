# AidFlow — 5 Min Presentation

## 🎯 Opening (30 sec) — READ OUT

> "When disasters strike, NGOs receive hundreds of field reports — handwritten, on WhatsApp, verbal. Coordinators manually read each one, guess the urgency, and spend hours calling volunteers. **People who need help the most wait the longest.**"

> "AidFlow fixes this. **Google Gemini AI reads field reports, classifies urgency instantly, and dispatches the right volunteer — in seconds, not hours.**"

---

## 🖥️ Live Demo (3 min) — JUST DO IT

**PINs:** Dharwad `1234` · Mumbai `5678` · Bengaluru `9012`

| # | What to Demo | Time |
|---|---|---|
| 1 | Open app → Welcome page → Sign in with Google | 15s |
| 2 | Browse & Join → Pick **Dharwad Relief Network** → Enter PIN `1234` → Dashboard loads with real data | 20s |
| 3 | **Submit a need** → Type: *"Flooding near bridge. 30 families trapped. Need boats immediately."* → Show AI classifying it as HIGH/Safety in 3 seconds | 30s |
| 4 | **OCR** → Upload handwritten report photo → AI extracts & classifies | 30s |
| 5 | **Volunteers tab** → Show roster with free/busy status → Open a HIGH need → Click **AI Auto-Assign** → Show AI reasoning | 30s |
| 6 | **Multi-NGO isolation** → Change org → Join **Mumbai** (PIN `5678`) → Completely different data, different volunteers, zero overlap → Switch back to Dharwad, everything intact | 30s |
| 7 | Resolve a need → Show volunteers auto-freed | 15s |

---

## 🧠 Technical (1 min) — READ OUT

### Google Technologies
- **Gemini 2.0 Flash** — 4 AI prompts: text classification, OCR extraction, volunteer count estimation, skill-based ranking
- **Firebase Firestore** — Real-time sync with `onSnapshot`, all data scoped by org ID
- **Firebase Auth** — Google Sign-In, auth-gated views
- **Firebase Hosting** — Zero-config CDN deployment

### Key Architecture Points
- **Multi-tenant isolation** — Each NGO's data is completely separated at the database query level. No cross-org queries exist in the codebase
- **PIN-protected access** — Organizations require a 4-digit PIN to join
- **Atomic transactions** — Volunteer assignments use Firestore transactions, preventing double-booking
- **Full lifecycle** — Open → Assigned → In Progress → Resolved, with auto-cleanup of volunteer status

### UN SDGs
- **SDG 3** (Health) — AI-prioritized medical emergency dispatch
- **SDG 11** (Cities) — Real-time disaster coordination at community level
- **SDG 17** (Partnerships) — Multi-NGO system connecting independent organizations

---

## 🎬 Closing (30 sec) — READ OUT

> "Every minute matters in a crisis. Our platform eliminates the coordination bottleneck — AI handles triage, humans focus on helping people. Three NGOs, three cities, completely isolated, PIN-protected. Built entirely on Google technologies, deployed at zero cost. **AidFlow — faster, smarter disaster response.**"

---

## 📋 Before You Start
- [ ] `npm run dev` running
- [ ] Signed out of Google (for clean demo)
- [ ] Handwritten report photo ready for OCR demo
- [ ] PINs memorized: `1234` · `5678` · `9012`
