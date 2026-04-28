import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

function env(name) {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : value;
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID'),
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firebase Analytics — auto-tracks page views and user engagement
// isSupported() prevents errors in environments where analytics isn't available (e.g., SSR, tests)
export const analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));

export default app;
