# TrustBox

Корпоративна платформа для анонімних та іменних звернень співробітників (Landing + Admin).

Референс концепції: [trustbox1.netlify.app](https://trustbox1.netlify.app/) — орієнтир за структурою, не копія дизайну.

## Стек

| Шар | Технологія |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Styles | Tailwind CSS v4 |
| UI | shadcn/ui + Motion |
| i18n | i18next (UA / EN / ES) |
| DB / Auth | Firebase Firestore + Authentication |
| Backend | Firebase Cloud Functions |
| Email | Resend (етап 06) |
| Hosting | GitHub Pages + GitHub Actions |

## Архітектура (MVP)

```
Browser (GitHub Pages SPA, HashRouter)
  ├─ Landing + Feedback Form
  └─ /#/admin/* (Auth-gated)
           │
           ▼
Firebase Auth ──► Firestore (deny-by-default rules)
           │
           ▼
Cloud Functions (validation, rate limit, email)
           │
           ▼
Resend / SMTP provider
```

### Ключові рішення

1. **HashRouter** — надійні deep links на GitHub Pages (`/#/admin`).
2. **Усі записи feedback** — лише через Cloud Function (не прямий клієнтський write).
3. **Firestore rules** — deny-by-default; читання звернень тільки для адмінів.
4. **Ролі** — `super_admin` / `admin` (архітектура готова, MVP може стартувати з одного super admin).
5. **Секрети** — тільки в Functions / GitHub Secrets; у клієнті лише `VITE_*` public config.

## Структура репозиторію

```
src/
  components/     # layout + ui
  features/       # landing (02), feedback (03), admin (05)
  pages/          # route-level screens
  providers/      # theme, auth
  locales/        # uk / en / es
  lib/            # firebase, utils, constants
  types/          # shared domain types
  routes/         # app routes
functions/        # Cloud Functions (scaffold)
firestore.rules   # deny-all skeleton
.github/workflows # Pages deploy
```

## Локальний запуск

Вимоги: Node.js ≥ 20.

```bash
cd trustbox
npm install
cp .env.example .env   # заповнити пізніше (етап 04)
npm run dev
```

Скрипти:

| Команда | Опис |
| --- | --- |
| `npm run dev` | Dev-сервер |
| `npm run build` | Production build |
| `npm run typecheck` | Перевірка типів |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run preview` | Перегляд збірки |

## Firebase (етап 04)

Детальна інструкція: [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

Коротко:

1. Створити Firebase project + Firestore + Auth (Google).
2. Скопіювати web config у `.env` (`cp .env.example .env`).
3. Опублікувати `firestore.rules` у Console (або `firebase deploy --only firestore:rules`).

Логін: Google `@221e.space`. Submit: прямий запис у Firestore.

## GitHub Pages

Workflow: `.github/workflows/deploy.yml` → після push у `main`:

`https://smile221e.github.io/TrustBox/#/`

Перед тестом продакшену:

1. Firebase Authentication → Google увімкнено.
2. Authorized domains: `localhost` + `smile221e.github.io`.
3. Firestore створено + опубліковані `firestore.rules`.
4. Repository secrets `VITE_FIREBASE_*` (уже для CI).

Spark (безкоштовний план) достатньо: логін Google `@221e.space` + запис звернень у Firestore.

## Статус інтеграцій

| Інтеграція | Статус |
| --- | --- |
| React / Vite / Tailwind / i18n / theme | ✅ Етап 01 |
| Landing UI / Motion / shadcn | ✅ Етап 02 |
| Feedback form | ✅ Етап 03 |
| Google auth (@221e.space) + Firestore submit | ✅ Етап 04 |
| Admin panel + public reviews | ✅ Етап 05 |
| Rocket Chat notify + polish | ⏳ Етап 06 |

## План етапів

1. **01** — ініціалізація, структура, конфіги
2. **02** — клієнтський дизайн landing
3. **03** — двокрокова форма
4. **04** — Firebase API, rules, антиспам
5. **05** — адмінпанель *(поточний)*
6. **06** — Rocket Chat / email, тести

Не переходьте до наступного етапу без підтвердження після перевірки поточного.
