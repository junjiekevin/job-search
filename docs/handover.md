# Handover Board

Coordination point for all agents. Read your ticket + these rules. Nothing else here concerns you.

## Rules

- Flow: `TODO → BUILD → REVIEW → QA → DONE`. Rework: REVIEW/QA → BUILD. Stuck: `BLOCKED` + question in log.
- Owner = who acts next. One owner per ticket. Update status + owner on every handoff.
- Log entries: newest first, dated, terse. Append only — never rewrite history.
- Scope creep → new ticket in TODO, not silent expansion.
- Every action item names its exact repo-relative path — `src/lib/db/queries.ts:42`, not "the db layer". No path = not actionable = invalid handoff.
- Fragments fine. No prose. Facts, paths, commands, verdicts.
- Archived completed tickets live in `docs/handover_archive.md`; check that file when previous ticket context is needed. Do not reopen archived tickets in Active — create a new ticket that cites the archive entry.

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

**Auth mandate (2026-07-26, user):** Google OAuth sign-in is required; signup page is required; proper DB support means user-owned rows + RLS isolation, not the prior single-user/all-authenticated model. Supersedes T-002 "No signup" acceptance.

**Sprint 1 — "jobs on screen":** schema → auth → search pipeline → dashboard → tracking. No AI this sprint. Serial order T-001 → T-005.
**Sprint 2 — "AI + résumés":** ai client → tailoring domain → résumé library → generate flow → paste-JD → spec sync. Serial order T-006 → T-007 → T-012 → T-008 → T-013 → T-009. Starts after T-005 DONE.
**Sprint 3 — "dashboard UX + search correctness":** search isolation → app tabs → visual polish. Serial order T-015 → T-016 → T-017.
**Backlog:** T-011 follow-companies (ATS boards) — after Sprint 3 + user greenlights.

### T-015 search-result-isolation
- status: TODO
- owner: builder
- scope: new searches must replace the visible result set; keep historical listings in DB, but do not mix older search rows into the current search view.
- files: supabase/migrations/0001_init.sql, src/lib/db/types.ts, src/domains/jobs/types.ts, src/domains/jobs/db.ts, src/domains/jobs/db.test.ts, src/app/actions.ts, src/components/job-search-form.tsx, src/app/page.tsx, docs/ARCHITECTURE.md
- accept:
  - real problem documented in log: src/app/actions.ts:25 upserts current provider rows; src/components/job-search-form.tsx:35 only refreshes; src/app/page.tsx:24 reads stored jobs, so older searches remain visible
  - supabase/migrations/0001_init.sql adds nullable `search_key text` to `jobs`; src/lib/db/types.ts matches; docs/ARCHITECTURE.md § Data model + § Core flows note that external search rows can be grouped by latest search key while historical rows remain stored
  - src/app/actions.ts computes a stable non-secret search key from normalized `{ what, where, country, page }`, passes it into the jobs upsert path, and returns `{ count, searchKey }`
  - src/domains/jobs/db.ts stamps `search_key` on external provider upserts; manual jobs keep `search_key = null`; upsert still conflicts on `(user_id, dedupe_hash)` and never deletes historical rows
  - src/components/job-search-form.tsx navigates to `/?searchKey=<returned key>` after a successful search; no raw provider request URLs, keys, or responses logged
  - src/app/page.tsx parses `searchKey`; `listJobs` filters by that key when present, so a second search excludes first-search-only rows from the visible Jobs list
  - clearing/removing `searchKey` intentionally shows the stored board/history; pasted manual jobs are not injected into a current external search result set
  - src/domains/jobs/db.test.ts covers two different search keys: `listJobs({ searchKey: key2 })` excludes rows only stamped with key1 and includes duplicate rows re-stamped by key2
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 tech_lead] created. Verdict: Rework current search contract. Options considered: delete old rows on search (reject: violates historical listings), filter by text query only (reject: provider results need not title-match exactly), add search_key grouping (recommend: one nullable column, preserves history, fixes visible mixing). Cite docs/ARCHITECTURE.md § Core flows #1 + § Data model.

### T-016 app-tabs-navigation
- status: TODO
- owner: builder
- scope: add clear tab navigation across authenticated app pages so the main dashboard is not a dead-end surface.
- files: src/components/app-tabs.tsx, src/app/page.tsx, src/app/resumes/page.tsx, src/app/jobs/[id]/page.tsx
- accept:
  - create src/components/app-tabs.tsx with explicit React return type; no new deps; CSS/Tailwind only
  - tabs link to current authenticated surfaces: Jobs `/`, Add job `/#paste-job`, Résumés `/resumes`; job detail keeps Jobs active and still has its back link
  - tabs render in the first viewport on src/app/page.tsx and src/app/resumes/page.tsx; src/app/jobs/[id]/page.tsx includes the same tabs above the detail content
  - active tab state is derived from pathname/hash-compatible props, not duplicated page-local styling; login/signup/callback pages do not show app tabs
  - mobile width 375px: tabs do not wrap text awkwardly or overlap; use horizontal scroll or compact sizing if needed
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 tech_lead] created. Requirement interpreted as authenticated app navigation, not auth pages. Real paths: src/app/page.tsx:29 main dashboard, src/app/resumes/page.tsx:9 résumé page, src/app/jobs/[id]/page.tsx:31 detail page. Keep README § User Experience: one primary dashboard, minimal navigation.

### T-017 visual-ux-polish
- status: TODO
- owner: builder
- scope: improve visual design and intuitive UX with the current Next/React/Tailwind stack; no feature sprawl, no marketing landing page.
- files: src/app/globals.css, src/app/layout.tsx, src/app/page.tsx, src/app/resumes/page.tsx, src/app/jobs/[id]/page.tsx, src/components/job-search-form.tsx, src/components/paste-job-form.tsx, src/components/job-card.tsx, src/components/resume-manager.tsx, src/components/status-select.tsx, src/components/generate-panel.tsx
- accept:
  - depends on T-016; do not change search semantics from T-015
  - src/app/page.tsx replaces the plain stacked gray panels at :29-84 with an app-like work surface: clear header, tabs, search/filter/results hierarchy, paste-JD as a secondary but discoverable workflow
  - src/components/job-card.tsx improves scanning for title/company/location/source/status/salary/employment/posted date without oversized cards or hidden primary actions
  - src/components/job-search-form.tsx, src/components/paste-job-form.tsx, src/components/resume-manager.tsx, src/components/status-select.tsx, and src/components/generate-panel.tsx share consistent input, button, error, pending, empty, and disabled states
  - use current stack only: no framer-motion, no lucide-react, no component library; motion limited to CSS transitions
  - UI remains a productivity tool per README § User Experience: no hero/landing page, no config screens, no decorative blob/orb backgrounds, no one-note blue/gray-only palette
  - card and control radii max `rounded-lg` unless an existing browser control forces otherwise; no nested cards
  - 375px and 1280px manual checks: no text overlap, clipped buttons, layout shift from hover/pending labels, or inaccessible filter controls
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 tech_lead] created. Verdict: Approve UI polish with constraints. Biggest risk is over-design; builder should improve hierarchy/density/affordance, not add new flows or dependencies. Cite README § User Experience + docs/ARCHITECTURE.md § Layout & code standards.

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

## Archive

Completed tickets live in [docs/handover_archive.md](handover_archive.md). Agents should consult the archive when active work needs previous context.

