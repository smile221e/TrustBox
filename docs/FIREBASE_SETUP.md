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
4. `smile@221e.space` auto-claims **super_admin** on first `/#/admin` visit
5. Super admin invites other admins by email in **Admins**

## Indexes

Public reviews no longer need a composite index. Other indexes in `firestore.indexes.json` are optional.

## Email notify to recipients (Spark-friendly)

After a feedback is submitted, TrustBox tries to email the chosen recipient **if** that recipient has an email in Admin → Recipients.

Configure **one** option in `.env` / GitHub secrets:

1. **EmailJS** (simplest): create a service + template with `to_email`, `subject`, `message`  
   Set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
2. **Webhook**: `VITE_NOTIFY_WEBHOOK_URL` — receives JSON `{ to, subject, text, html, ... }`

Without either, submit still works; only the email is skipped.

## Public reviews

1. Author checks “allow publish” on the form (`allowPublicReply`)
2. Admin opens the feedback → replies → checks **Publish on site**
3. The reply appears in the landing **Reviews** section

Optional Cloud Functions remain in `functions/` for Rocket Chat later.
