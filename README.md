# AidFlow — AI-Powered NGO Coordination

> **The Problem:** NGO field workers report crises on paper. Coordinators manually triage them. Volunteers get mis-matched. People wait longer than they should.  
> **Our Solution:** A real-time web platform where Google Gemini AI reads the report, classifies the urgency, and dispatches the right volunteer — in seconds.

Built for **Google Solutions Challenge 2026** using Google Gemini + Firebase.

---

## 🌍 UN Sustainable Development Goals

This project directly addresses **3 UN SDGs:**

| SDG | Goal | How We Address It |
|---|---|---|
| 🏥 **SDG 3** | Good Health & Well-Being | AI-prioritized medical emergency dispatch ensures the most critical health crises get immediate volunteer attention |
| 🏙️ **SDG 11** | Sustainable Cities & Communities | Real-time coordination platform strengthens disaster resilience and crisis response at the community level |
| 🤝 **SDG 17** | Partnerships for the Goals | Multi-stakeholder system connecting NGOs, field workers, and volunteers through a shared AI-powered dashboard |

---

## 📊 Impact Metrics

| Metric | Manual Process | With Our AI | Improvement |
|---|---|---|---|
| **Need Classification** | ~5 min (read report, discuss, decide priority) | **~3 seconds** (Gemini classifies instantly) | **100x faster** |
| **Volunteer Matching** | Hours of phone calls to find the right person | **One click** — AI evaluates all open needs against skills | **Eliminates guesswork** |
| **Field Report Digitization** | 10-15 min manual data entry from paper forms | **Instant OCR** — snap a photo, AI extracts all fields | **Zero typing** |
| **Coordination Errors** | Duplicate dispatches, missed emergencies | **Atomic transactions** prevent race conditions; real-time board shows live status | **Zero double-bookings** |

> According to [OCHA](https://www.unocha.org/), poor coordination during humanitarian crises leads to duplicated efforts and gaps in service delivery affecting millions. Our platform aims to eliminate this at the grassroots NGO level.

---

## 🚀 What It Does (3 AI-Powered Features)

| Feature | User Input | AI Does | User Sees |
|---|---|---|---|
| **Submit Need** | Describe the crisis | Gemini classifies urgency (HIGH/MEDIUM/LOW) & type | Need appears on live board instantly |
| **Scan Field Report** | Photo of handwritten form | Gemini Vision reads text, extracts structure | Pre-filled review card to confirm |
| **Match Volunteer** | Name, skills, zone | Gemini matches volunteer to the best open HIGH-priority need | Recommended assignment with reasoning |

---

## 🧠 How the AI Works

Three focused prompts power the entire application:

1. **Text Classification (Zero-Shot JSON):** Low-temperature Gemini call with a strict JSON schema output for reliable urgency categorization from free-text descriptions.
2. **Vision + OCR Extraction:** Multimodal Gemini call combining inline image data with instructions to gracefully handle messy handwriting, multilanguage text (English/Hindi/Kannada), and partially unreadable sections.
3. **Semantic Volunteer Matching:** Gemini receives the full list of open HIGH-priority needs alongside the volunteer's profile and reasons through the best assignment — including edge cases like no matching skill.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS |
| **Database** | Firebase Firestore (real-time sync) |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **AI** | Google Gemini API (`gemini-flash-latest`) |
| **Backend** | Firebase Cloud Functions (secure AI proxy) |
| **Analytics** | Firebase Analytics (usage tracking) |
| **Hosting** | Firebase Hosting |

---

## 💻 Getting Started

### Prerequisites
- Node.js v18+
- A Firebase project (Firestore + Auth enabled)
- A Google Gemini API Key from [AI Studio](https://aistudio.google.com/)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your Firebase + Gemini keys

# 3. Start development server
npm run dev
```

App runs at `http://localhost:5173/`

### Production Build
```bash
npm run build
```

---

## 🔐 Security Architecture

- All Gemini API calls route through **Firebase Cloud Functions** — the API key is never exposed to the browser.
- Firestore writes are locked behind **Firebase Authentication** — only verified NGO coordinators can modify the board.
- Volunteer assignments use **atomic Firestore transactions** — preventing race conditions when two coordinators dispatch to the same need simultaneously.

---

## 🗺️ Future Roadmap

| Phase | Feature | Status |
|---|---|---|
| **v1.0** | Text + OCR submission, AI classification, volunteer matching | ✅ Complete |
| **v1.1** | Multi-language UI (Hindi, Kannada, Telugu) | 🔜 Planned |
| **v1.2** | Offline PWA mode for low-connectivity field areas | 🔜 Planned |
| **v1.3** | WhatsApp bot integration for need reporting via message | 🔜 Planned |
| **v2.0** | Admin analytics dashboard with crisis trend visualization | 🔜 Planned |
| **v2.1** | Multi-NGO tenancy — each organization gets its own board | 🔜 Planned |

> **Multilingual OCR already works** — the Gemini Vision prompt handles English, Hindi, Kannada, and Telugu field reports today. The roadmap item is about translating the UI itself.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx            # Sticky header + tab navigation
│   │   └── StatusBar.jsx         # Live needs count bar
│   ├── PriorityBoard/
│   │   ├── NeedsBoard.jsx        # Filterable needs grid
│   │   ├── NeedCard.jsx          # Individual need card
│   │   └── UrgencyBadge.jsx      # HIGH/MEDIUM/LOW badge
│   ├── NeedSubmission/
│   │   ├── TextSubmitForm.jsx    # Text-based need form
│   │   ├── OCRUpload.jsx         # Image upload + Gemini Vision
│   │   └── OCRReviewCard.jsx     # Editable OCR review
│   ├── VolunteerMatch/
│   │   ├── VolunteerForm.jsx     # Volunteer profile form
│   │   └── MatchResult.jsx       # AI match + confirm assignment
│   └── common/
│       ├── ErrorBoundary.jsx     # Global crash handler
│       ├── LoadingSpinner.jsx    # Dual-ring spinner
│       └── SeedButton.jsx       # Dev-only: seed mock data
├── services/
│   ├── firebase.js               # Firebase app + Firestore init
│   ├── firestore.js              # DB read/write/subscribe/transaction
│   └── gemini.js                 # 3 AI prompts (Cloud Functions)
├── context/
│   ├── AuthContext.jsx           # Google Sign-In state
│   └── NeedsContext.jsx          # Real-time needs subscription
├── hooks/
│   └── useNeeds.js               # Sorted needs + loading/error
├── utils/
│   ├── compressImage.js          # Canvas-based image compression
│   └── imageToBase64.js          # File → base64 converter
├── App.jsx                       # Main app + routing
├── main.jsx                      # React entry point
└── index.css                     # Design system + component styles

functions/
└── index.js                      # 3 Cloud Functions (secure AI proxy)
```
