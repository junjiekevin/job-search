# Handover Board

Coordination point for all agents. Read your ticket + these rules. Nothing else here concerns you.

## Rules

- Flow: `TODO → BUILD → REVIEW → QA → DONE`. Rework: REVIEW/QA → BUILD. Stuck: `BLOCKED` + question in log.
- Owner = who acts next. One owner per ticket. Update status + owner on every handoff.
- Log entries: newest first, dated, terse. Append only — never rewrite history.
- Scope creep → new ticket in TODO, not silent expansion.
- Every action item names its exact repo-relative path — `src/lib/db/queries.ts:42`, not "the db layer". No path = not actionable = invalid handoff.
- Fragments fine. No prose. Facts, paths, commands, verdicts.

## Ticket format

```
### T-000 short-title
- status: TODO | BUILD | REVIEW | QA | DONE | BLOCKED
- owner: builder | reviewer | qa | tech_lead | user
- scope: what + why. 1-2 lines max.
- files: paths touched (builder maintains)
- accept: verifiable criteria, one per line
- log:
  - [YYYY-MM-DD agent] what happened / decision / risk / verdict
```

---

## Active

**Architecture mandate (2026-07-25, user):** stateless, LLM-first, minimal DB. No résumé persistence or normalization — résumé processed in-memory per request, output returned, all candidate data + LLM artifacts discarded. Persist only non-sensitive metadata (jobs, application status, timestamps, generation metrics). Spec: docs/ARCHITECTURE.md § Candidate data policy + § Data model (3 tables). CODING.md § AI updated to match.

**Logging mandate (2026-07-25, user):** `console.*` = local-debug only, all stripped pre-ship (T-010). Secrets, API keys, raw API responses, résumé text, LLM outputs NEVER logged — and nothing sensitive ever client-side. Binding: docs/CODING.md § Logging. Reviewer enforces on every ticket.

**Job sources mandate (2026-07-25, user):** real sources supplied in docs/reference/ (adzuna.json, reed.md, greenhouse.md, lever.md, ashby.md); keys in .env.example (REED_API_KEY, ADZUNA_APP_ID/API_KEY). tech_lead decision: core = search aggregators Adzuna (primary) + Reed — one keyword+location box, cross-industry, no config. ATS boards (Greenhouse/Lever/Ashby) = deferred opt-in "follow companies" (T-011), kept out of core (token config = anti user-friendly). Two provider archetypes per docs/ARCHITECTURE.md § Job sources. Replaces the earlier Remotive placeholder.

**Résumé storage mandate (2026-07-25, user):** REVERSES the earlier stateless-inputs policy for résumés only. Store up to 3 uploaded résumé files (PDF/DOCX) in a private Supabase Storage bucket + `resumes` table (cached extracted_text, one `is_selected`); user switches active résumé. LLM OUTPUTS stay ephemeral (user chose "ephemeral outputs"). Generated docs = DOCX only. Add a paste-a-JD flow that saves the JD as a `source='manual'` job then runs the same generate system. Spec: docs/ARCHITECTURE.md § Candidate data policy + § Data model (4 tables) + § Core flows.

**Sprint 1 — "jobs on screen":** schema → auth → search pipeline → dashboard → tracking. No AI this sprint. Serial order T-001 → T-005.
**Sprint 2 — "AI + résumés":** ai client → tailoring domain → résumé library → generate flow → paste-JD → spec sync. Serial order T-006 → T-007 → T-012 → T-008 → T-013 → T-009. Starts after T-005 DONE.
**Backlog:** T-011 follow-companies (ATS boards) — after Sprint 2.

### T-001 supabase-schema
- status: QA
- owner: qa
- scope: REVISED again — résumé storage mandate. 4 tables now (jobs, applications, resumes, generations) + private Storage bucket. Adds résumé persistence back.
- files: supabase/migrations/0001_init.sql, src/lib/db/types.ts
- accept:
  - supabase/migrations/0001_init.sql rewritten in place (uncommitted — tech_lead exception to append-only rule, docs/CODING.md § DB)
  - generations: id, job_id FK → jobs ON DELETE CASCADE, resume_id FK → resumes ON DELETE SET NULL, kind text CHECK in analysis|resume|cover_letter, model text, prompt_tokens int, completion_tokens int, duration_ms int, created_at timestamptz default now(). Still metrics/links only — no prompt, no output, no analysis body
  - resumes: id, storage_path text NOT NULL, filename text NOT NULL, mime_type text NOT NULL, extracted_text text, is_selected boolean NOT NULL default false, uploaded_at timestamptz default now()
  - jobs: salary_min numeric NULL, salary_max numeric NULL, salary_currency text NULL, employment_type text NULL (nullable, no CHECK — normalize in domains/jobs/normalize.ts); source supports 'manual' for pasted JDs; dedupe_hash unique unchanged
  - applications (status enum) unchanged; indexes: generations(job_id), generations(resume_id)
  - private Storage bucket `resumes` created (SQL insert into storage.buckets with public=false) + storage RLS policy allowing authenticated CRUD on that bucket only
  - RLS enabled + authenticated-only policies on all 4 tables (keep prior reviewer fixes: explicit factory return types, env comments)
  - src/lib/db/types.ts Database type matches all 4 tables exactly (incl. resumes, resume_id, jobs salary/employment cols)
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 reviewer] Approve → QA. QA attack: supabase/migrations/0001_init.sql:39 resumes has storage_path/filename/mime_type/extracted_text/is_selected/uploaded_at only; supabase/migrations/0001_init.sql:52 generations.resume_id FK SET NULL; supabase/migrations/0001_init.sql:61 private resumes bucket created; supabase/migrations/0001_init.sql:85 storage.objects authenticated CRUD limited to bucket_id='resumes'; supabase/migrations/0001_init.sql:75 RLS enabled on jobs/applications/resumes/generations; src/lib/db/types.ts:4 jobs salary/employment columns match SQL; src/lib/db/types.ts:86 resumes type matches SQL; src/lib/db/types.ts:115 generations type includes nullable resume_id and no output fields. verify: npm run lint pass; npm run build hit EPERM on .next/trace in sandbox, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] BUILD → rewrite complete. Migration: re-added resumes table (storage_path, filename, mime_type, extracted_text, is_selected), added resume_id to generations (FK → resumes ON DELETE SET NULL), added salary_min/max/currency and employment_type to jobs (nullable), created private storage bucket `resumes` with file_size_limit=5MB and PDF/DOCX only, added storage.objects RLS policy for authenticated CRUD, added idx_generations_resume_id index. types.ts updated to match all 4 tables exactly. Build + lint pass.
  - [2026-07-25 tech_lead] QA → BUILD. Résumé storage mandate: re-add resumes table (files in private Storage bucket + cached extracted_text, is_selected) + generations.resume_id (SET NULL). Outputs still NOT stored. In-place rewrite (0001 uncommitted) — no 0002. Cite: docs/ARCHITECTURE.md § Data model, § Candidate data policy. Note for QA: résumé PII is now at rest — verify RLS on resumes table AND the Storage bucket policy.
  - [2026-07-25 tech_lead] QA → BUILD. Job sources mandate: jobs gains salary_min/max/currency + employment_type (nullable). Adzuna+Reed both supply them; core filters for a job tool. In-place rewrite (0001 still uncommitted) — no 0002. Cite: docs/ARCHITECTURE.md § Data model, § Job sources. Prior QA pass on the 3-table shape still holds; re-verify only the added columns + types.ts.
  - [2026-07-25 reviewer] Approve → QA. QA attack: supabase/migrations/0001_init.sql:49 anon blocked/auth allowed on jobs; supabase/migrations/0001_init.sql:50 anon blocked/auth allowed on applications; supabase/migrations/0001_init.sql:51 anon blocked/auth allowed on generations; supabase/migrations/0001_init.sql:35 no candidate-data columns; src/lib/db/types.ts:109 Enums matches SQL enums only. verify: npm run lint pass; npm run build hit EPERM on .next/trace in sandbox, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] REVIEW → BUILD → REVIEW. Removed generation_kind from Database.public.Enums in types.ts:111 — matches text CHECK in SQL, not a Postgres enum. GenerationKind type alias kept for table column typing. Build + lint pass.
  - [2026-07-25 reviewer] Rework. [Major] src/lib/db/types.ts:111 — Database.public.Enums exposes generation_kind, but supabase/migrations/0001_init.sql:38 defines generations.kind as text CHECK, not a Postgres enum → remove generation_kind from Database.public.Enums or change SQL to a real enum; accept currently specifies text CHECK, so prefer removing only the DB enum entry.
  - [2026-07-25 reviewer] verify: npm run lint pass; npm run build hit EPERM on .next/trace in sandbox, passed after approved escalation. Build warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] BUILD → REVIEW. Rewrote 0001_init.sql: dropped resumes/analyses, added generations (id, job_id FK, kind CHECK, model, prompt_tokens, completion_tokens, duration_ms, created_at), indexes, RLS + authenticated policies on all 3 tables. Updated types.ts: removed resumes/analyses types, added generations type + GenerationKind enum, removed unused Json type. client.ts/server.ts unchanged (already had explicit return types + env comments from prior fix). Build + lint pass.
  - [2026-07-25 tech_lead] REVISED → BUILD. Stateless mandate: 4 tables → 3. resumes/analyses deleted; generations added (metrics only). Migration uncommitted (verified `git log --name-only`: only LICENSE committed) → rewrite 0001 in place, do not add 0002. Design cite: docs/ARCHITECTURE.md § Data model, § Candidate data policy.
  - [2026-07-25 reviewer] Rework. supabase/migrations/0001_init.sql:11 — public Supabase tables have RLS disabled for jobs/applications/resumes/analyses while browser anon client exists → enable RLS and add authenticated-only policies for single-user app.
  - [2026-07-25 reviewer] Rework. src/lib/db/client.ts:4 — exported factory lacks explicit return type; src/lib/db/client.ts:6 and src/lib/db/client.ts:7 use uncommented env non-null assertions → add explicit Supabase client return type and validate required envs or justify assertions.
  - [2026-07-25 reviewer] Rework. src/lib/db/server.ts:5 — exported async factory lacks explicit return type; src/lib/db/server.ts:9 and src/lib/db/server.ts:10 use uncommented env non-null assertions → add explicit Supabase client return type and validate required envs or justify assertions.
  - [2026-07-25 reviewer] verify: npm run lint pass; npm run build pass after sandbox retry. Build warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 tech_lead] docs/CODING.md adopted — DDD layout. Domain queries go in src/domains/*/db.ts; lib/db = client factories only.
  - [2026-07-25 tech_lead] created. Schema spec in docs/ARCHITECTURE.md § Data model.
  - [2026-07-25 builder] created migration 0001_init.sql with 4 tables, application_status enum, FKs, indexes. Created types.ts (Database type), client.ts (browser), server.ts (ssr). Build + lint pass. No barrel index.ts per CODING.md.
  - [2026-07-25 builder] fix: added RLS + authenticated policies to all 4 tables; added explicit SupabaseClient<Database> return types to both factories; added comments justifying ! assertions on env vars. Build + lint pass.

### T-002 auth-guard
- status: QA
- owner: qa
- scope: Supabase Auth, single user (using GCP OAuth - already configured). Route guard + login page. No signup, no roles.
- files: src/proxy.ts, src/app/login/page.tsx, src/app/login/actions.ts
- accept:
  - unauthenticated request to any route (except /login) → redirect /login
  - email+password login via server action returning `{ ok } | { ok: false, error }`; success → /
  - no signup route or UI anywhere
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 reviewer] Approve → QA. QA attack: src/proxy.ts:31 unauthenticated / redirects to /login; src/proxy.ts:31 /login remains reachable unauthenticated; src/app/login/actions.ts:13 missing/non-string email/password returns { ok: false, error }; src/app/login/actions.ts:18 valid credentials returns { ok: true }; src/app/login/page.tsx:12 success navigates to /. verify: npm run lint pass; npm run build hit EPERM on .next/trace-build in sandbox, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] BUILD → REVIEW. Fixed all 3 rework items: proxy.ts — added explicit Promise<NextResponse> return type + env ! comment; actions.ts — added LoginResult type, runtime type-narrowing on FormData entries (typeof check before cast); page.tsx — added React.JSX.Element return type, narrowed error display with !state.ok guard. Build + lint pass.
  - [2026-07-25 reviewer] Rework. [Major] src/proxy.ts:4 — exported proxy lacks explicit return type; src/proxy.ts:8 and src/proxy.ts:9 use env non-null assertions without a comment → add explicit NextResponse/Promise return type and justify or validate required env vars.
  - [2026-07-25 reviewer] Rework. [Major] src/app/login/actions.ts:5 — exported server action lacks explicit return type; src/app/login/actions.ts:6 and src/app/login/actions.ts:7 cast FormData values to string without runtime narrowing, so non-string user input can reach signInWithPassword → define action result type and validate email/password are strings before auth call.
  - [2026-07-25 reviewer] Rework. [Major] src/app/login/page.tsx:7 — exported page component lacks explicit return type per docs/CODING.md strict TS rule → add explicit JSX/React return type.
  - [2026-07-25 reviewer] verify: npm run lint pass; npm run build hit EPERM on .next/trace in sandbox, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] TODO → BUILD → REVIEW. Created src/proxy.ts — Next.js 16 proxy (middleware) with @supabase/ssr session check, redirects unauthenticated to /login, config matcher excludes static assets. Created src/app/login/page.tsx — client form with useActionState, redirects to / on success. Created src/app/login/actions.ts — server action validates email+password, calls supabase.auth.signInWithPassword, returns { ok } | { ok: false, error }. No signup route. Note: Next.js 16 requires export name `proxy` not `middleware` — fixed after build error. Build + lint pass.
  - [2026-07-25 tech_lead] created. Depends on T-001 (lib/db client factories). Next 16: middleware file is `src/proxy.ts`, not middleware.ts. Session refresh per @supabase/ssr docs.

### T-003 jobs-search
- status: BUILD
- owner: builder
- scope: jobs domain — Adzuna + Reed search providers, normalize → dedupe_hash → upsert, searchJobs server action. Core search flow per docs/ARCHITECTURE.md § Core flows #1 + § Job sources.
- files: src/domains/jobs/types.ts, src/domains/jobs/providers/adzuna.ts, src/domains/jobs/providers/reed.ts, src/domains/jobs/normalize.ts, src/domains/jobs/normalize.test.ts, src/domains/jobs/db.ts, src/app/actions.ts
- accept:
  - shared SearchProvider shape in types.ts: `search({ what, where?, country?, page? }) => Promise<NormalizedJob[]>`; both providers implement it
  - adzuna.ts: GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page} with app_id+app_key query params (default country 'gb', configurable); Zod-validate response (trust boundary); map redirect_url → posting_url AND apply_url; salary_min/max from response ONLY when salary_is_predicted='0'; salary_currency by country; employment_type from contract_time
  - reed.ts: GET https://www.reed.co.uk/api/1.0/search with keywords/locationName; HTTP Basic auth, REED_API_KEY as username + empty password; Zod-validate; posting_url = reed job page by jobId; salary from min/max; employment_type from fullTime/partTime/contract flags
  - env validated at call, fail loud if a provider's key missing; a provider that errors is skipped (console.error message only, never response body) so one bad source can't kill the search
  - searchJobs action fans out to both providers in parallel, normalizes, upserts, returns count
  - dedupe_hash = stable hash of lowercased/trimmed (company, title, location); same posting from both sources → 1 row; running same search twice adds 0 duplicate rows
  - upsert on dedupe_hash conflict updates fetched_at + fields, never deletes (historical listings)
  - normalize.test.ts locks hash stability + per-provider field mapping (incl. predicted-salary exclusion)
  - never logs API keys, request URLs with keys, or raw responses (docs/CODING.md § Logging)
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 reviewer] Rework. [Major] src/domains/jobs/db.ts:30 — explicit `any` suppresses the strict TS/no-any standard at the DB write boundary → remove the cast/disable and type the Supabase upsert directly or with a typed local helper.
  - [2026-07-26 reviewer] Rework. [Major] src/domains/jobs/providers/reed.ts:62 — Reed links come from optional `jobUrl`, but accept requires posting_url from `jobId`; if the API omits jobUrl the normalized job has no Reed page → build the deterministic Reed job URL from `job.jobId` and use it for posting_url/apply_url.
  - [2026-07-26 reviewer] Rework. [Major] src/domains/jobs/providers/reed.ts:16 — Reed schema/mapping ignores the required `fullTime`/`partTime`/`contract` flags and derives employment_type from `contractType`/`jobType` instead → include the flags and map employment_type from them.
  - [2026-07-26 reviewer] Rework. [Major] src/domains/jobs/normalize.test.ts:57 — predicted-salary coverage bypasses Adzuna provider mapping by passing null salaries directly to normalizeJob, and no Reed mapping test exists → test adzuna.search/reed.search with mocked fetch/env for salary, link, and employment_type mapping.
  - [2026-07-26 reviewer] Rework. [Major] src/domains/jobs/normalize.test.ts:1 — imports `vitest`, but package.json has no vitest devDependency/test script, so the added test is not runnable by the project → add the runner wiring or switch to an existing test runner.
  - [2026-07-26 reviewer] verify: npm run lint pass; npm run build hit EPERM on .next/trace in sandbox, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-25 builder] TODO → BUILD → REVIEW. Created types.ts (SearchParams, SearchProvider, NormalizedJob). Created adzuna.ts — Adzuna provider with Zod validation, salary_is_predicted filtering, country→currency mapping, contract_time→employment_type. Created reed.ts — Reed provider with HTTP Basic auth, Zod validation, salary max/min, employment_type mapping. Created normalize.ts — dedupe_hash via sha256(lowercased/trimmed company|title|location), normalizeJob wrapper. Created normalize.test.ts — hash stability, case-insensitivity, whitespace trimming, null location, predicted-salary exclusion. Created db.ts — upsertJobs via supabase upsert onConflict dedupe_hash, updates fetched_at. Created actions.ts — searchJobs fans out to Adzuna+Reed via Promise.allSettled, skips failed providers (console.error message only), returns count. Note: supabase-js upsert type inference requires `as any` on the query builder (eslint-disable applied). Build + lint pass.
  - [2026-07-25 tech_lead] RESCOPED. Remotive placeholder → Adzuna (primary, cross-industry, 19 countries) + Reed (UK). Search model, not fixed feed = one keyword box, no config. Refs: docs/reference/adzuna.json, docs/reference/reed.md. Two archetypes in docs/ARCHITECTURE.md § Job sources; ATS boards deferred → T-011. Depends T-001.

### T-004 dashboard
- status: TODO
- owner: builder
- scope: `/` jobs dashboard — one search box (keyword + optional location) fetches new jobs; list, filter, sort, detail view. Server components; state in URL searchParams, no client state lib.
- files: src/app/page.tsx, src/app/jobs/[id]/page.tsx, src/components/job-search-form.tsx, src/components/job-card.tsx, src/domains/jobs/db.ts
- accept:
  - job-search-form: keyword input + optional location input → submits to searchJobs action (T-003) with pending state; on success revalidates the list
  - list shows title, company, location, salary (when present), source badge, posted_at; local filter matches title+company (SQL ilike, in domains/jobs/db.ts); sort by posted_at desc default
  - detail page renders description + salary/employment_type + posting_url and apply_url links (new tab)
  - filters/local-search/sort read from searchParams; `'use client'` only where interactive (the search form)
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] RESCOPED to search-box model (was Refresh button) per job sources mandate — keyword search is the user-friendly cross-industry entry point. Depends T-003. Keep UI minimal — README § User Experience; one page + detail, no dialogs.

### T-005 application-tracking
- status: TODO
- owner: builder
- scope: applications domain — status + notes CRUD, status control in UI. Pure CRUD, no AI, per docs/ARCHITECTURE.md § Core flows #5.
- files: src/domains/applications/types.ts, src/domains/applications/db.ts, src/app/jobs/[id]/actions.ts, src/components/status-select.tsx, src/app/page.tsx
- accept:
  - setting a status upserts the applications row (created on first set); statuses exactly per docs/ARCHITECTURE.md data model enum
  - notes editable + persisted from detail page
  - current status visible on dashboard list; filter by status via searchParams
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created. Depends T-001 + T-004.

### T-006 ai-client
- status: TODO
- owner: builder
- scope: src/lib/ai/client.ts — the ONLY file importing the LLM SDK. OpenRouter via openai SDK. Generic, domain-agnostic.
- files: src/lib/ai/client.ts
- accept:
  - openai SDK with baseURL https://openrouter.ai/api/v1, key from OPENROUTER_API_KEY (validated at call, fail loud if missing)
  - exports complete(system, user) → string and completeJSON(system, user, zodSchema) → parsed T; LLM output Zod-validated (trust boundary)
  - returns usage (prompt/completion tokens) alongside content — T-008 needs it for generations metrics
  - no imports from src/domains or src/app; no prompt text in this file
  - never logs the API key, request bodies, or raw API responses (docs/CODING.md § Logging)
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] accept updated: logging mandate — no key/request/response logging.
  - [2026-07-25 tech_lead] created. Provider per CODING.md § AI (OpenRouter, `OPENROUTER_API_KEY` — already in .env.example:7). Model id via env or const in this file; pick a mini-class model (README § Model Requirements).

### T-007 tailoring-domain
- status: TODO
- owner: builder
- scope: résumé text extraction + one-call analysis+tailor+cover-letter + in-memory DOCX. Outputs ephemeral per docs/ARCHITECTURE.md § Candidate data policy.
- files: src/domains/resume/parse.ts, src/domains/resume/parse.test.ts, src/domains/resume/build-docx.ts, src/domains/analysis/types.ts, src/domains/analysis/prompts.ts, src/domains/analysis/generate.ts, src/domains/analysis/generate.test.ts
- accept:
  - parse.ts: (Buffer, mime) → plain text; .docx via mammoth, PDF via a text extractor (e.g. unpdf/pdf-parse — must pass npm audit --omit=dev, § Dependency security posture); unsupported mime → { ok: false, error }
  - generate.ts: (resumeText, job) → { analysis, tailoredResume, coverLetter } via lib/ai completeJSON, Zod schema in domains/analysis/types.ts; analysis covers README § AI Job Analysis fields
  - prompts.ts system prompt enforces: never fabricate experience, preserve facts, reorder/reword only (README § AI Resume Tailoring)
  - build-docx.ts: text → DOCX Buffer via docx pkg, in memory, deterministic
  - grep-verifiable: no LLM output written to db.ts/Storage in domains/analysis; parse/generate/build-docx never console.* the résumé text or outputs
  - tests lock parse output (DOCX + PDF) + generate schema parsing (mock lib/ai)
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] REVISED: parse now handles PDF + DOCX (résumé storage mandate — uploads are PDF/DOCX); dropped .txt/paste-résumé path (résumés come from the library now). Depends T-006. One LLM call returns all three outputs — cheaper and simpler than three; split later only if quality demands it.

### T-012 resume-library
- status: TODO
- owner: builder
- scope: résumé library — upload (PDF/DOCX, max 3) to private Storage, extract+cache text, list, select active, delete. Per docs/ARCHITECTURE.md § Core flows #2.
- files: src/domains/resume/db.ts, src/domains/resume/types.ts, src/app/resumes/page.tsx, src/app/resumes/actions.ts, src/components/resume-manager.tsx
- accept:
  - db.ts: upload (write file to `resumes` bucket + insert row with parse.ts extracted_text), list, setSelected (clears is_selected on all others in one tx/rpc so exactly one stays selected), delete (removes row AND Storage object). All queries here only
  - max 3 enforced server-side: 4th upload → { ok: false, error }, not silent overwrite
  - resume-manager: shows the ≤3 résumés (filename, uploaded_at, selected badge), upload input accepting .pdf/.docx only, select + delete buttons; pending states; actions return { ok } | { ok: false, error }
  - grep-verifiable: extracted_text / résumé bytes never console.* logged
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created. Depends T-007 (parse.ts) + T-001 (resumes table + bucket). Single-user so no user_id yet; RLS + private bucket are the guard. Selected-résumé invariant lives in db.ts, not the UI.

### T-008 generate-flow
- status: TODO
- owner: builder
- scope: job-detail generate — grade the SELECTED résumé against the job → render analysis/advice + cover letter, download DOCX. Persists ONE generations metrics row; no outputs stored.
- files: src/app/jobs/[id]/page.tsx, src/app/jobs/[id]/actions.ts, src/components/generate-panel.tsx, src/domains/analysis/db.ts
- accept:
  - generate-panel: shows the active résumé (link to /resumes to switch/upload if none selected); Generate button; pending state
  - action: load selected résumé's extracted_text (domains/resume/db.ts) + job → generate (T-007) → return { ok, data: { analysis, coverLetter, docxBase64 } }; client converts base64 → blob download; no Storage write, no output at rest
  - action inserts one generations row per call (job_id, resume_id, kind, model, prompt_tokens, completion_tokens, duration_ms) via domains/analysis/db.ts
  - no selected résumé → { ok: false, error } prompting the user to pick one
  - grep-verifiable: LLM outputs never passed to any insert/update or console.* call
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created. Depends T-004 + T-007 + T-012. Base64-through-action fine at résumé scale (<1 MB). Résumé now comes from the library (selected), not a per-request upload.

### T-013 paste-jd
- status: TODO
- owner: builder
- scope: paste a job description → save as a `source='manual'` job → land on its detail page (reuses T-008 generate). Per docs/ARCHITECTURE.md § Core flows #3.
- files: src/app/page.tsx, src/app/actions.ts, src/components/paste-job-form.tsx, src/domains/jobs/db.ts
- accept:
  - paste-job-form: textarea (description) + title + optional company/location; submits to a createManualJob action
  - action: insert jobs row source='manual', dedupe_hash = hash over full content incl description (distinct pastes never collapse; identical paste dedupes), posting_url/apply_url null; returns new job id; redirect to /jobs/[id]
  - detail page + generate work identically for manual jobs (no external links shown when null)
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created. Depends T-004 + T-008. User chose "save pasted JD as a board job" → manual jobs are first-class, trackable + re-generatable.

### T-011 follow-companies (ATS boards, deferred)
- status: TODO
- owner: builder
- scope: opt-in "follow companies" — pull per-company ATS boards (Greenhouse, Lever, Ashby) into the same jobs pipeline. Backlog: do NOT start until Sprint 2 DONE + user greenlights.
- files: src/domains/jobs/providers/greenhouse.ts, src/domains/jobs/providers/lever.ts, src/domains/jobs/providers/ashby.ts, src/domains/jobs/types.ts, src/domains/jobs/db.ts, src/app/page.tsx
- accept:
  - BoardProvider shape in types.ts: `fetchBoard(token) => Promise<NormalizedJob[]>`; three providers implement it (refs: docs/reference/greenhouse.md, lever.md, ashby.md)
  - greenhouse.ts: GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true; ashby.ts: GET api.ashbyhq.com/posting-api/job-board/{name}; lever.ts: GET api.lever.co/v0/postings/{company}?mode=json; all keyless, Zod-validated
  - user manages a small list of followed {provider, token} tokens (storage decision at build time — simplest: an env-seeded list or a tiny followed_boards table; propose in log before building)
  - normalize + dedupe + upsert reuse the exact T-003 path; no candidate data
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created, DEFERRED. ATS boards need a per-company token = config friction, so out of the core search box (README § User Experience, minimal config). Archetype designed now (docs/ARCHITECTURE.md § Job sources) so this is additive later, not a rewrite. Open question for builder when picked up: where followed tokens live.

### T-010 log-sweep (pre-ship gate)
- status: TODO
- owner: builder
- scope: strip all debug logging before ship, per logging mandate. Last ticket before deploy — do not start until user calls "ready".
- files: src/** (whatever the sweep finds)
- accept:
  - `grep -rn "console\." src/` → 0 matches
  - error paths still return `{ ok: false, error }` — removing logs must not remove handling
  - npm run build && npm run lint pass
- log:
  - [2026-07-25 tech_lead] created per user logging mandate. Gate, not sprint work — sequence after all other tickets DONE.

---

## Done

_(newest first: `T-### — one-line outcome`)_

- T-009 — README re-aligned to résumé storage mandate: § Resume Management (up to 3, switch, stored), workflow (library + paste-JD + DOCX output), Storage → private bucket (tech_lead, per user directive 2026-07-25). Supersedes the earlier stateless wording.
