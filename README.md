# Lumen

The care coordination OS for families and professional caregivers.

Medications, appointments, the household journal, and the care circle — in one quiet place. Built as a production-ready Angular + NestJS + Neon (Postgres) + Tailwind application.

This is not a medical device. Demo data is a fictional family (the Voss circle) so you can try the board immediately.

## Why it exists

Fifty-three million unpaid caregivers in the United States currently run this work from a notes app, a fridge calendar, and memory. Missed evening doses, expired refills, and school 504 plans that nobody can find are the failure mode. Lumen is the shared board.

## Stack

| Layer | Choice |
| --- | --- |
| Web | Angular 19 (standalone, signals) |
| API | NestJS 12 on Express |
| Database | Neon Postgres in production, embedded PGLite in local preview |
| Styling | Tailwind CSS v4 + a tokenized design system |
| Hosting | Nest serves the SPA and `/api` from one process |

## Quick start

Requires Node 22.

```bash
npm ci
npm run dev
```

Open `/` for the product site and `/app` for the care board.

Production build:

```bash
npm ci
npm run build
npm start
```

CI runs typecheck, the production Angular build, and the Nest API test suite on every push to `main`.

## Deploy

1. Provision a [Neon](https://neon.tech) project and copy the pooled `DATABASE_URL`.
2. Build and start a single process that serves the Angular app and the Nest API:

```bash
npm ci
npm run build
DATABASE_URL=postgres://... npm start
```

Or build the image:

```bash
docker build -t lumen-care .
docker run -p 8080:8080 -e DATABASE_URL=postgres://... lumen-care
```

Migrations apply on `npm run build` against Neon, and automatically on boot when using the embedded PGLite preview.

## API

All routes are under `/api`.

- `GET /health` — liveness + backend (`neon` or `pglite`)
- `GET /dashboard` — today’s doses, 7-day adherence, alerts, upcoming visits, open work
- `GET|POST|PATCH /people`
- `GET|POST|PATCH /medications` and `POST /medications/:id/doses`
- `GET|POST|PATCH|DELETE /appointments`
- `GET|POST|PATCH|DELETE /tasks`
- `GET|POST|DELETE /journal`
- `GET|POST|PATCH|DELETE /team`

Schema lives in `migrations/0002_lumen.sql` and is applied automatically on boot (PGLite) or during `npm run build` (Neon).

## Project layout

```
apps/web     Angular SPA
apps/api     NestJS API + static host
migrations   SQL source of truth
public       Favicon, share assets, PWA chrome
```

## License

MIT
