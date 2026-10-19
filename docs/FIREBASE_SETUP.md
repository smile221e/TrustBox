# Firebase setup (Spark-friendly)

TrustBox auth & submit work **without Cloud Functions / Blaze**.

## 1. Project

1. [Firebase Console](https://console.firebase.google.com/) → project `trustbox-221e`
2. Add a **Web app** → copy config into `.env` as `VITE_FIREBASE_*`
3. **Authentication** → Sign-in method → enable **Google**
4. Authorized domains: `localhost`, `smile221e.github.io`
5. **Firestore Database** → Create database (production mode)

## 2. Security rules

Paste contents of `firestore.rules` into  
Firestore → Rules → Publish.

Rules allow:

- Google users with `@221e.space` → **create** feedback
- Admins only → **read** feedback (Stage 05)

## 3. Local / Pages

```bash
cp .env.example .env   # fill VITE_FIREBASE_*
npm run dev
```

GitHub Pages builds with repository secrets `VITE_FIREBASE_*`.

## Access model

1. Sign in with Google
2. Email must be `@221e.space`
3. Submit writes to `feedback` in Firestore

Optional Cloud Functions / PeopleForce remain in `functions/` for a future upgrade, but are **not required**.
