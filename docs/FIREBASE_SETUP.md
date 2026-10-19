# Firebase setup (Stage 04)

## Access gate (Google + PeopleForce)

1. Enable **Authentication → Google** in Firebase Console.
2. Add authorized domains (`localhost`, your GitHub Pages host).
3. Fill `VITE_FIREBASE_*` in `.env`.
4. User signs in with **Google** (prefer `@221e.space` Workspace).
5. Server checks PeopleForce: active employee under **221e** (`99123`) or **ITC** (`38131`).

Callables `verifyAccessEmail` and `submitFeedback` require a Firebase Auth session.
Email is taken from the ID token — the client cannot spoof another mailbox.

Local PeopleForce check in `npm run dev`: Vite `/api/verify-access` + `PEOPLEFORCE_API_KEY` in `.env`.
Production: same key on Cloud Functions (`functions/.env` / Secret Manager).

Until Functions are deployed, GitHub Pages may use `VITE_ALLOW_DOMAIN_FALLBACK=true`
(any Google user with `@221e.space`). Turn it **off** after Functions go live.

Also add Firebase Auth authorized domain: `smile221e.github.io`.

**Never commit the PeopleForce Company API key.**


## 1. Create project

1. Open [Firebase Console](https://console.firebase.google.com/) → Create project.
2. Enable **Authentication** → Email/Password (needed for Stage 05 admin).
3. Create **Firestore** (production mode is fine — rules deploy next).
4. Register a **Web app** and copy the config into `.env`:

```bash
cp .env.example .env
```

Fill all `VITE_FIREBASE_*` values.

## 2. Install & deploy backend

```bash
# root
npm install

cd functions
npm install
npm run build
cd ..

firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Callable deployed: `submitFeedback` (region `europe-west1`).

## 3. Seed recipients (optional)

Function falls back to built-in recipient ids if docs are missing.
To override names/emails (emails used in Stage 06 notify), create docs in `recipients/{id}`
using `scripts/seed-recipients.json` as a template (Console or Admin SDK).

Leave `email` empty until Stage 06.

## 4. Local emulators (optional)

```bash
firebase emulators:start --only auth,firestore,functions
```

In `.env`:

```
VITE_USE_FIREBASE_EMULATOR=true
```

Then `npm run dev` and submit the form against emulators.

## 5. Verify

1. Open the landing → fill the two-step form → Submit.
2. In Firestore, a `feedback/{id}` document appears with `status: new`.
3. A second burst of submits from the same IP should hit rate limit after 5/hour.
