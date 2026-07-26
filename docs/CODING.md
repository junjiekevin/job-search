# Coding Standards

Binding for all agents on every ticket. Violations = rework. Exceptions: tech_lead only, logged on the ticket.

## Layout — DDD-lite

```
src/
  app/          # Next.js routes + server actions. Delivery only: parse input → call domain → render.
  components/   # Shared UI.
  domains/      # Business logic, one folder per domain. The heart of the repo.
    jobs/         # aggregation: providers/ (one file per source), normalize, dedupe
    applications/ # status tracking
    resume/       # résumé: in-memory parse + DOCX build — nothing persisted
    analysis/     # AI job analysis + resume tailoring: prompts, result parsing
  lib/          # Infrastructure. Domain-agnostic leaves.
    ai/           # client.ts — ONLY file importing the LLM SDK. Generic complete()/completeJSON().
    db/           # Supabase client factories (server/browser) + generated DB types.
```

Domain module: `types.ts` (owned types), `db.ts` (ALL queries for that domain), logic files. No `index.ts` barrels.

## Dependency direction

`app → domains → lib`. Strict:

- `app/` → domains, components, lib.
- `domains/X` → lib + other domains' `types.ts` only. Never app, never another domain's logic.
- `lib/` → nothing in `src/`.
- `components/` → domain `types.ts` + lib only.

Upward import or cycle = Critical.

## File size

- Hard cap: **250 LOC** per file (`wc -l`) under `src/`. Generated files exempt.
- At ~200, split by responsibility — a split that just moves lines is worse than none.

## Style

- Efficient and short. Fewest lines that stay clear. Delete > add.
- No speculative abstraction: no interface with one implementation, no one-use util, no wrapper that renames.
- Strict TS. No `any`. Exported functions: explicit return types. `!` needs a comment.
- Server Components by default; `'use client'` only for interactivity.
- Comments explain *why*, never *what*. No commented-out code, no TODO without a ticket-log entry.

## Naming

Rule of thumb: **kebab on disk, Pascal for shapes, camel for behavior, SNAKE for env + SQL.**

| What | Case | Example |
|---|---|---|
| Files & folders | kebab-case | `job-card.tsx`, `dedupe.ts` (Next reserved names as-is: `page.tsx`, `route.ts`) |
| URL route segments | kebab-case | `app/jobs/[id]/` |
| React components (symbol) | PascalCase | `JobCard` — file stays kebab: `job-card.tsx` |
| Types, interfaces, enums | PascalCase | `Job`, `ApplicationStatus` — no `I` prefix |
| Zod schemas | PascalCase + `Schema` | `AnalysisSchema` |
| Functions, variables, props | camelCase | `dedupeJobs`, `postingUrl` |
| Fixed module constants | SCREAMING_SNAKE | `MAX_UPLOAD_BYTES` — camelCase if computed |
| Env vars | SCREAMING_SNAKE | `OPENROUTER_API_KEY`; browser-safe → `NEXT_PUBLIC_` prefix |
| Postgres tables & columns | snake_case, tables plural | `applications.job_id` |
| Test files | `<target>.test.ts` | `dedupe.test.ts`, colocated |

snake_case ↔ camelCase mapping happens in `domains/*/db.ts` only — DB shape never leaks past it.

## Errors & validation

- Zod at trust boundaries only: env, LLM output, external APIs, user file uploads. Internal calls trust types.
- Server actions return `{ ok: true, data } | { ok: false, error }`. Never swallow; `console.error` server-side is the floor.
- Fail loud and early. No defensive try/catch around code that can't throw.

## Logging

- `console.*` is local-debug scaffolding only. ALL of it is stripped before ship (ticket T-010) — write logs expecting deletion.
- NEVER log secrets, API keys, raw API responses, résumé text, or LLM outputs — server or client, debug or not.
- Client-side code (`'use client'`, components) logs nothing sensitive, period: the browser console is exposed surface. Error messages shown/logged client-side carry no payloads.
- `console.error` server-side may carry error name/message, never request or response bodies.

## AI

- SDK touched only by `lib/ai/client.ts` (OpenRouter via openai SDK, `OPENROUTER_API_KEY`). Provider swap = that one file.
- Prompts live in the owning domain (`domains/analysis/`), not in lib.
- Outputs are ephemeral: LLM analysis/tailored résumé/cover letter exist only in request memory — never written to DB, Storage, or logs. Persist only `generations` metadata (kind, model, tokens, duration, job_id, resume_id). Résumé *inputs* are the only candidate data at rest (files + extracted_text), per docs/ARCHITECTURE.md § Candidate data policy.

## DB

- Queries only in `domains/*/db.ts`, using `lib/db` factories.
- Migrations: plain SQL, numbered, append-only — never edit a committed migration.

## Tests

- Colocated `*.test.ts`. Target: domain logic worth locking (normalize, dedupe, parsing). No UI snapshots.
- QA owns test files; builder may add them for tricky logic.

## Enforcement

- builder — self-check before handoff: layout, direction, cap, style.
- reviewer — standards lens; any violation is must-fix.
- tech_lead — audits drift, grants exceptions.
