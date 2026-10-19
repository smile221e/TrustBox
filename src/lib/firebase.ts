import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions'

import { isFirebaseConfigured } from '@/lib/env'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export { isFirebaseConfigured }

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let functions: Functions | null = null
let emulatorsConnected = false

function ensureClients() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill VITE_FIREBASE_* values.',
    )
  }

  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  if (!auth) {
    auth = getAuth(app)
  }
  if (!db) {
    db = getFirestore(app)
  }
  if (!functions) {
    const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'europe-west1'
    functions = getFunctions(app, region)
  }

  if (!emulatorsConnected && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    emulatorsConnected = true
  }
}

/** Firebase client bootstrap — requires `VITE_FIREBASE_*` in `.env`. */
export function getFirebaseApp(): FirebaseApp {
  ensureClients()
  return app!
}

export function getFirebaseAuth(): Auth {
  ensureClients()
  return auth!
}

export function getDb(): Firestore {
  ensureClients()
  return db!
}

export function getFirebaseFunctions(): Functions {
  ensureClients()
  return functions!
}
