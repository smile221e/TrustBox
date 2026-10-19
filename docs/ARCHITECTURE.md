# TrustBox — Architecture

## Collections

| Collection | Purpose | Client access |
| --- | --- | --- |
| `feedback` | Submissions | Corporate create; admins read / status update |
| `feedbackReplies` | Admin replies | Admins create; public read if `isPublic` |
| `recipients` | Addressees (+ notify email later) | Admins read/write |
| `admins` | Roles | Self-read; bootstrap / invite claim create; super manage |
| `adminInvites` | Pending admin emails | Super manage; invitee read/delete on claim |
| `rateLimits` | Legacy / unused on Spark | None |
| `auditLogs` | Admin actions | Super admin read |

## Submit flow (Stage 04)

1. Client validates form (two steps + optional public-reply checkbox).
2. Authenticated `@221e.space` user writes `feedback` via Firestore rules.
3. Honeypot (`website`) short-circuits with fake success.

## Admin flow (Stage 05)

1. Same Google session as the employee gate.
2. `smile@221e.space` self-claims `admins/{uid}` as `super_admin` (rules).
3. Super admin invites others via `adminInvites/{email}`; invitee claims on next visit.
4. Admins list feedback, change status, reply (optional publish to reviews wall).
5. Admins edit recipient name/email for future Rocket Chat notify.

## Public reviews

Replies with `isPublic: true` appear in the landing **Reviews** section (authors must have opted in with `allowPublicReply`).

## Deferred

- Rocket Chat notifications to selected recipients
- Email (Resend) delivery of replies

## GitHub Pages routing

Hash routes:

- `/#/`
- `/#/admin` → dashboard if admin, else denied
- `/#/admin/dashboard`
- `/#/admin/feedback/:id`
- `/#/admin/recipients`
- `/#/admin/admins`
