# 🚀 Deployment Guide: AidFlow

This guide covers how to run and deploy the AidFlow platform completely for free. 

The architecture consists of a React frontend (Vite) and a serverless backend hosted on Firebase (Firestore, Auth, and Cloud Functions). Because we utilize the Firebase Spark plan and Google AI Studio's free tier, your total hosting cost will be **$0**.

---

## 💻 Local Development with Docker

The easiest way to run the application locally is using Docker. This ensures you have the exact same environment as production without needing to install Node.js locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### Setup
1. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
2. Fill in your API keys in the `.env` file (see Environment Variables section below).
3. Start the development server with hot-reloading:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```
4. Access the app at `http://localhost:3000`

---

## 🔥 Firebase Backend Setup (Required)

While the frontend can be hosted anywhere, the backend **must** be deployed to Firebase to utilize its free tier services (Firestore Database, Firebase Auth, Cloud Functions).

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it "AidFlow".
3. Disable Google Analytics (optional, for simplicity).
4. Go to **Build > Authentication** and enable the **Google** sign-in provider.
5. Go to **Build > Firestore Database** and click **Create database**. Start in **Test mode** (we will deploy our secure rules later). Choose a location close to your users (e.g., `asia-south1` for India).

### 2. Set Up the Gemini API Key
Your Cloud Functions need the Gemini API key securely stored in Google Cloud Secret Manager.

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to your account: `firebase login`
3. Initialize the project (if not already done): `firebase init`
4. Set the API key as a secret:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   *Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/) when prompted.*

### 3. Deploy the Backend
Deploy your Firestore database rules, indexes, and Cloud Functions:
```bash
firebase deploy --only firestore,functions
```

---

## 🌐 Deploying the Frontend (Free Options)

You have multiple options for deploying the frontend. We recommend **Option A (Firebase Hosting)** since you are already using Firebase for the backend, but Vercel and Render are great alternatives.

### Option A: Firebase Hosting (Recommended)
This deploys both your frontend and backend to Firebase in one go.

1. Ensure your `.env` file is fully populated.
2. Run the deployment script:
   - **Linux/Mac**: `./deploy.sh`
   - **Windows**: `deploy.bat`

### Option B: Vercel
Vercel is optimized for Vite applications.

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Vercel will automatically detect the Vite framework.
4. **Important**: Add all your `.env` variables in the Vercel dashboard under "Environment Variables".
5. Click **Deploy**.

### Option C: Docker via Render
If you want to use the included `Dockerfile` to host the container directly.

1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Select the **Docker** runtime.
4. Render will automatically build the `Dockerfile` and expose port 80.
5. Add your `.env` variables in the Render dashboard.

---

## 🤖 CI/CD with GitHub Actions

We have included a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys your app to Firebase Hosting whenever you push to the `main` branch.

To enable this:

1. Generate a Firebase CI token by running this on your local machine:
   ```bash
   firebase login:ci
   ```
2. Go to your GitHub repository > **Settings** > **Secrets and variables** > **Actions**.
3. Add a new repository secret named `FIREBASE_TOKEN` and paste the token from step 1.
4. Add all other environment variables from your `.env` file as repository secrets (e.g., `VITE_FIREBASE_API_KEY`, etc).
5. Push to the `main` branch to trigger a deployment.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `VITE_GEMINI_API_KEY` | Key for Google's AI models. | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_FIREBASE_API_KEY` | Firebase config value. | Firebase Console > Project Settings > General > Your Apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config value. | Same as above. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config value. | Same as above. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase config value. | Same as above. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase config value. | Same as above. |
| `VITE_FIREBASE_APP_ID` | Firebase config value. | Same as above. |

*(Note: For security, the Gemini API key used by the backend Cloud Functions is injected separately via `firebase functions:secrets:set GEMINI_API_KEY` and is not exposed to the browser.)*
