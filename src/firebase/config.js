import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

console.log('Environment variables:');
Object.keys(import.meta.env).forEach(key => {
  if (key.startsWith('VITE_FIREBASE_')) {
    console.log(`${key}:`, import.meta.env[key]);
  }
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

console.log('Firebase Config:', firebaseConfig);

if (Object.values(firebaseConfig).some(value => !value)) {
  console.error('Some Firebase configuration values are missing or undefined');
}

const app = initializeApp(firebaseConfig)
console.log('Firebase initialized successfully');
const db = getFirestore(app)
console.log('Firestore initialized');
const auth = getAuth(app)
console.log('Auth initialized');

export { db, auth }