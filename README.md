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

1. Створити Firebase project + Firestore + Auth (Email/Password).
2. Скопіювати web config у `.env` (`cp .env.example .env`).
3. Задеплоїти rules, indexes і Functions:

```bash
cd functions && npm install && npm run build && cd ..
firebase login && firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Callable: `submitFeedback` (honeypot + rate limit + validation + Firestore write).

## GitHub Pages

Workflow: `.github/workflows/deploy.yml` → після push у `main`:

`https://smile221e.github.io/TrustBox/#/`

Перед тестом продакшену:

1. Firebase Authentication → Google увімкнено.
2. Authorized domains: `localhost` + `smile221e.github.io`.
3. Repository secrets `VITE_FIREBASE_*` (уже для CI).
4. Cloud Functions (потрібен план **Blaze**):  
   `npx firebase-tools login` → `npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions`  
   з `PEOPLEFORCE_API_KEY` у `functions/.env`.

Без Functions Google-вхід на Pages не пройде PeopleForce-перевірку.

## Статус інтеграцій

| Інтеграція | Статус |
| --- | --- |
| React / Vite / Tailwind / i18n / theme | ✅ Етап 01 |
| Landing UI / Motion / shadcn | ✅ Етап 02 |
| Feedback form | ✅ Етап 03 |
| Firestore + Functions submit API | ✅ Етап 04 |
| Admin auth / CRUD | ⏳ Етап 05 |
| Email (Resend) + E2E | ⏳ Етап 06 |

## План етапів

1. **01** — ініціалізація, структура, конфіги
2. **02** — клієнтський дизайн landing
3. **03** — двокрокова форма
4. **04** — Firebase API, rules, антиспам *(поточний)*
5. **05** — адмінпанель
6. **06** — email, тести, деплой

Не переходьте до наступного етапу без підтвердження після перевірки поточного.
