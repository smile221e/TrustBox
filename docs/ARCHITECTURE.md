# TrustBox — Architecture

## Collections

| Collection | Purpose | Client access |
| --- | --- | --- |
| `feedback` | Submissions | None write; admins read / status update |
| `recipients` | Addressees | Admin-only; public resolve via Function |
| `admins` | Roles | Admin self-read / super_admin manage |
| `feedbackReplies` | Outbound replies | Admin-only read; write via Functions (Stage 06) |
| `rateLimits` | IP submit throttles | Functions (Admin SDK) only |
| `auditLogs` | Admin actions | Super admin read |

## Submit flow (Stage 04)

1. Client validates form (two steps).
2. `submitFeedback` callable:
   - honeypot (`website` non-empty → fake `{ id: 'accepted' }`)
   - schema validation
   - IP hash rate limit (5 / hour)
   - resolve recipient (Firestore or built-in defaults)
   - write `feedback` with server timestamps
3. Return `{ id }` — never echo emails or rate-limit internals.
4. Optional notify email to recipient (Stage 06).

## Admin flow (Stage 05+)

1. Firebase Auth session.
2. Role document `admins/{uid}` with `role: admin | super_admin`.
3. Rules: `request.auth != null && isAdmin()`.
4. Replies go through callable that uses Resend secret (Stage 06).

## GitHub Pages routing

Hash routes avoid server rewrite requirements:

- `/#/`
- `/#/admin`
- `/#/admin/dashboard`
- `/#/admin/recipients`

`public/404.html` kept as a secondary fallback if BrowserRouter is ever adopted.
