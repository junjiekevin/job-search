# Architecture

Lightweight architecture for the AI-powered personal job dashboard.
Companion to [README.md](../README.md) — that file says *what*; this file says *how*.

Guiding rule: **one developer, one user, one deployable.** Every decision below
optimizes for simplicity, speed, low AI cost, and easy maintenance. When in
doubt, do the boring thing.

---

## Stack (final)

| Concern       | Choice                                   | Why |
|---------------|------------------------------------------|-----|
| App           | Next.js (App Router) + React + TypeScript | Single deployable; SSR dashboard is fast with no client state framework |
| Backend       | Server Actions (mutations) + Route Handlers (only where a URL is needed) | No separate API layer to maintain |
| Database      | Supabase Postgres, plain SQL migrations   | 4 tables; SQL is the simplest source of truth |
| Data access   | `supabase-js` + generated types — **no ORM** | An ORM is overhead at this scale; typed client is enough |
| Job sources   | Adzuna (primary) + Reed search APIs; ATS boards later | Keyword+location search = cross-industry, one box, no config. See § Job sources |
| Storage       | Supabase Storage, private `resumes` bucket | Holds up to 3 uploaded résumé files (PDF/DOCX). RLS-guarded. See § Candidate data policy |
| Résumé parse  | `mammoth` (DOCX) + a PDF text extractor    | Extract text at upload for grading; cached in `resumes.extracted_text` |
| Auth          | Supabase Auth, single user                | Middleware guard; no roles, no user management |
| AI            | OpenRouter (lightweight model) behind `lib/ai/` | Cheap, fast; provider swappable by editing one file |
| DOCX          | `docx` npm package, in-memory             | Deterministic output generation; built per request, never stored |
| Hosting       | Vercel                                    | Zero-config deploys |

Inputs (résumé files) are stored; outputs (LLM analysis, tailored résumé, cover letter)
are never stored — see § Candidate data policy.

---

## Layout & code standards

Defined in [CODING.md](CODING.md) — binding for all agents. Summary: DDD-lite. `src/domains/{jobs,applications,resume,analysis}` own business logic, types, and queries; `src/lib/{ai,db}` is domain-agnostic infrastructure; `src/app` is thin delivery. Dependency direction `app → domains → lib`, files ≤ 250 LOC.

---

## Data model (4 tables)

```
jobs          id, source, external_id, title, company, location, description,
              posting_url, apply_url, salary_min, salary_max, salary_currency,
              employment_type, posted_at, fetched_at, dedupe_hash (unique)

applications  id, job_id → jobs, status (saved|applying|applied|interview|offer|rejected|archived),
              notes, updated_at

resumes       id, storage_path, filename, mime_type, extracted_text, is_selected,
              uploaded_at
              -- up to 3 rows (enforced in domains/resume/db.ts); exactly one is_selected

generations   id, job_id → jobs, resume_id → resumes (SET NULL), kind (analysis|resume|cover_letter),
              model, prompt_tokens, completion_tokens, duration_ms, created_at
              -- operational metrics + links ONLY: no prompt, no LLM output, no candidate columns
```

Notes:
- `dedupe_hash` = stable hash of normalized (company, title, location). Dedup is SQL upsert, not AI. Same posting from two providers collapses to one row. **Manual (pasted-JD) jobs** hash over full content (incl. description) so distinct pastes never falsely collapse.
- Salary/employment_type are nullable — many listings omit them. Store salary only when the source gives a real figure; never Adzuna's *predicted* salary (README Non-Goal: no salary prediction).
- `resumes`: max 3, `is_selected` marks the active résumé used for grading; setting one selected clears the others (in `db.ts`). Files live in the private `resumes` Storage bucket; `extracted_text` cached to avoid re-parsing on each generation.
- `generations.resume_id` is `ON DELETE SET NULL` so deleting a résumé preserves historical metrics.
- Historical listings are kept by never deleting from `jobs` (search upserts).

---

## Job sources

Two provider archetypes, both behind `domains/jobs/providers/`, both emitting the same
normalized `Job` before it reaches `db.ts`. Adding a source never touches the pipeline.

- **Search providers (core)** — `search({ what, where, page }) → Job[]`. Keyword+location
  APIs spanning every industry, so one search box serves any user, any field.
  - **Adzuna** (primary): `GET /v1/api/jobs/{country}/search/{page}`, `app_id`+`app_key` query auth. 19 countries, category taxonomy, salary. `redirect_url` is the apply/posting link (their T&C requires using it). Description is truncated to 500 chars.
  - **Reed** (UK): `GET /api/1.0/search`, API key as HTTP Basic username (empty password). Search result carries description + salary + contract flags.
- **Board providers (deferred, opt-in)** — `fetchBoard(token) → Job[]`. Per-company ATS
  feeds (Greenhouse `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`, Lever
  `api.lever.co/v0/postings/{company}`, Ashby `api.ashbyhq.com/posting-api/job-board/{name}`),
  keyless but requiring a per-company token. Kept out of the core: pasting tokens is the
  config friction the README rejects. Enabled later as a "follow companies" feature.

---

## Candidate data policy

Deliberate split (user decision 2026-07-25): **inputs are stored, outputs are ephemeral.**

- **Résumé inputs are persisted.** Up to 3 uploaded files (PDF/DOCX) live in the private
  `resumes` Storage bucket + a `resumes` row with cached `extracted_text`. RLS restricts
  all of it to the authenticated user. The user selects one as active; it is graded
  against the chosen job.
- **LLM outputs stay ephemeral.** Analysis, tailored résumé, and cover letter are
  generated, returned to the browser, and discarded server-side. Never written to DB or
  Storage; no output cache — re-running on a mini model is cheaper than storing PII.
- Generated DOCX is built in memory and returned as base64; the browser turns it into a
  download. Server keeps no output file.
- **PII that IS at rest** = the résumé files + extracted text only. Guard it: private
  bucket, RLS on `resumes`, delete removes both the row and the Storage object.
- Log discipline: `console.*` is local-debug only and fully stripped pre-ship; never carries secrets, API responses, résumé text, or prompt/output bodies; nothing sensitive ever reaches the browser console. Rules: docs/CODING.md § Logging.

---

## Core flows

1. **Search jobs**: user enters keyword (+ optional location/country) → Server Action `searchJobs` fans out to enabled search providers in parallel → normalize → upsert by `dedupe_hash`. Dashboard then lists stored jobs (never-deleted history) with local search/sort/filter.
2. **Manage résumés**: user uploads a PDF/DOCX (max 3) → `domains/resume` stores the file in the `resumes` bucket, extracts text, writes a `resumes` row → user picks the active one (`is_selected`). Upload of a 4th is blocked until one is deleted; delete removes row + Storage object.
3. **Paste a job**: user pastes a JD (+ title/company/location) → Server Action saves it as a `jobs` row (`source='manual'`) → lands on its detail page, identical to an aggregated job.
4. **Generate**: on a job's detail page, the *selected* résumé's text + the job description → `domains/analysis` prompts via `lib/ai` → returns analysis/advice + tailored résumé + cover letter + DOCX (base64) → client downloads → server discards all outputs; writes one `generations` metrics row (job_id, resume_id).
5. **Track status**: Server Action updates `applications.status` / `notes`. Pure CRUD, no AI.

---

## What we are deliberately NOT doing

Per README Non-Goals, plus implementation-level refusals:

- No ORM, no GraphQL, no tRPC, no client state library (server components + actions suffice).
- No résumé normalization into structured columns, and no storing of LLM outputs or an analysis cache — only the raw résumé file + its extracted text are persisted (§ Candidate data policy).
- No job queue / background workers — refresh is on-demand and awaited.
- No AI agent frameworks or multi-step agent loops. One prompt in, one result out.
- No test scaffolding for its own sake — test `domains/jobs` dedup/normalize and `domains/analysis` output parsing; skip UI snapshot tests.
- No config screens. Configuration is `.env`.

## Dependency security posture

- Bar: `npm audit --omit=dev` must report **0 vulnerabilities**. Production deps are what ship.
- `package.json` `overrides` pin patched transitive deps (`postcss`, `sharp`) until upstreams catch up. Re-check with `npm audit` after dependency bumps and remove overrides once upstream ranges include the fix.
- Known accepted finding (dev-only): `brace-expansion <=5.0.7` DoS via the ESLint plugin chain (`eslint-config-next` → `minimatch@3`). Lint-time only, never shipped, not exploitable here. A tree-wide override to the patched v5 breaks minimatch v3's API (verified — crashes `npm run lint`), so it is accepted until the ESLint ecosystem migrates.

## Extension points (designed-in, not built)

- **New job source** → new file in `domains/jobs/providers/` (search or board archetype per § Job sources).
- **Follow-companies (ATS boards)** → enable the board providers + a place to store tracked tokens. Designed, deferred.
- **New AI provider** → edit `lib/ai/client.ts` only.
- **A few more users later** → add RLS policies keyed on `user_id`; schema gets a `user_id` column then, not now (`resumes` especially — files become per-user).
- **More than 3 résumés / naming / versions** → the cap lives in `domains/resume/db.ts`; raise it or add a label column there without schema churn.
