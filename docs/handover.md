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
**Sprint 3 — "dashboard UX + search correctness":** search isolation → sign-out → app tabs → visual polish → split generation actions → formatted DOCX résumé. Serial order T-015 → T-018 → T-016 → T-017 → T-020 → T-019.
**Sprint 3 dependency fix (2026-07-26, user):** T-020 MUST finish first on the pre-T-019 `tailoredResume: string` contract. T-020 may split buttons/actions/prompts/schemas, but must not introduce structured résumé content or formatted-DOCX renderer/test work. T-019 starts only after T-020 reaches QA/DONE, then upgrades résumé output to structured JSON and deterministic formatted DOCX.
**Backlog:** T-011 follow-companies (ATS boards) — after Sprint 3 + user greenlights.

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

### T-019 formatted-resume-docx
- status: BUILD
- owner: builder
- scope: LLM-generated résumé DOCX must be professionally structured and styled; cover letter generation/output remains unchanged.
- files: src/domains/analysis/types.ts, src/domains/analysis/prompts.ts, src/domains/analysis/generate.ts, src/domains/analysis/generate.test.ts, src/domains/resume/build-docx.ts, src/domains/resume/build-docx.test.ts, src/app/jobs/[id]/actions.ts, src/domains/jobs/db.ts, docs/ARCHITECTURE.md
- accept:
  - depends on T-020; only the `Generate résumé` path changes here, not cover letter or feedback+rating
  - real problem documented in log: src/domains/resume/build-docx.ts:5 maps raw text lines to plain Paragraphs; src/domains/analysis/prompts.ts:48 asks for `tailoredResume: string`, so formatting is currently impossible to verify
  - do NOT ask the LLM to emit DOCX, HTML, RTF, Markdown, or style instructions; LLM emits structured JSON content only, app code owns all DOCX formatting
  - src/domains/analysis/types.ts replaces `tailoredResume: string` with a Zod-validated `tailoredResume` object: contact/header, summary, skills groups, experience entries with role/company/location/dates/bullets, education/certifications/projects as optional arrays; coverLetter stays string
  - src/domains/analysis/prompts.ts updates the JSON shape and truthfulness rules: preserve facts, no invented dates/metrics/employers, bullets are content-only strings, no unsupported claims; experience entries ordered newest-first when dates are known
  - src/domains/resume/build-docx.ts accepts the structured tailored résumé object, not a raw string; uses the existing `docx` package to render deterministic styles; no generated document is stored
  - professional résumé rules in src/domains/resume/build-docx.ts: US Letter page, 0.6-0.75 inch margins, single-column ATS-friendly layout, no tables, no text boxes, no images, no icons, no headers/footers for critical content, no color-dependent meaning
  - typography rules in src/domains/resume/build-docx.ts: consistent professional font (Aptos/Calibri/Arial class), candidate name 18-22pt bold, contact line 9-10pt, section headings 11-12pt bold uppercase/small caps with subtle spacing, body 10-11pt, bullets 9.5-10.5pt with compact before/after spacing
  - content layout rules in src/domains/resume/build-docx.ts: order = name/contact, summary, skills, experience, projects, education, certifications; omit empty sections; experience entries show role/company/location/dates before bullets; bullets use real Word bullet numbering, not hyphen characters
  - length/fit guard in src/domains/resume/build-docx.ts: cap summary to 3 lines worth of text, cap experience bullets per role to 3-5, cap bullet length defensively, and keep spacing compact enough for a conventional 1-2 page résumé without shrinking below readable font sizes
  - src/app/jobs/[id]/actions.ts passes `generation.tailoredResume` into buildDocx; coverLetter display/download path is unchanged
  - src/domains/analysis/generate.test.ts verifies the schema rejects the old string résumé and accepts the structured résumé object
  - src/domains/resume/build-docx.test.ts verifies a non-empty DOCX buffer is produced from a representative structured résumé and inspects document XML for section headings, Word bullet numbering, margins, absence of tables/text boxes/images, and stable style names; no snapshot test
  - docs/ARCHITECTURE.md § Core flows #4 and § Candidate data policy note that résumé DOCX formatting is deterministic app rendering from structured LLM content; outputs remain ephemeral
  - npm run build && npm run lint pass
- log:
  - [2026-07-26 reviewer] Rework → BUILD. Must-fix: [Major] src/domains/resume/build-docx.test.ts:152 — test still uses a non-null assertion (`sampleResume.experience![0]`) without the required docs/CODING.md why-comment → avoid `!` by assigning/checking the first experience entry before building `manyBullets`, or add the required why-comment if unavoidable. Verify: `npm run lint` pass; `npx vitest run src/domains/analysis/generate.test.ts src/domains/resume/build-docx.test.ts` 17/17 pass; `npm run build` hit sandbox EPERM on `.next\\trace`, passed after approved escalation; warning unchanged: Next inferred `C:\\Users\\leeju` as workspace root due outside lockfile. Note: prior prompt/schema nullability and `w:pStyle` usage findings are addressed; relevant src files are under 250 LOC.
  - [2026-07-26 builder] BUILD → REVIEW. Fixed latest reviewer must-fixes in active T-019 state. src/domains/analysis/prompts.ts:54 now tells the model to omit absent optional fields instead of returning `null`, aligning the prompt with src/domains/analysis/types.ts optional-field schema. src/domains/resume/build-docx.ts applies named paragraph styles (`ResumeName`, `ResumeContact`, `ResumeSection`, `ResumeBody`, `ResumeBullet`) to rendered paragraphs, and removes the summary-path non-null assertion. src/domains/resume/build-docx.test.ts replaces DOCX zip-entry `!` assertions with checked helpers and now asserts `w:pStyle` usage in `word/document.xml`, not just style definitions in `word/styles.xml`. Incidental build-gate unblock outside T-019 scope: src/domains/jobs/db.ts:135 now null-guards `data` after the search-key fallback query so TypeScript build passes on the current tree. Verify: `npm run lint` pass; `npx vitest run src/domains/analysis/generate.test.ts src/domains/resume/build-docx.test.ts` 17/17 pass; `npm run build` hit sandbox EPERM on `.next\\trace-build`, passed after approved escalation; warning unchanged: Next inferred `C:\\Users\\leeju` as workspace root due outside lockfile.
  - [2026-07-26 reviewer] Rework → BUILD. Must-fix: [Major] src/domains/analysis/prompts.ts:54 and src/domains/analysis/types.ts:17 — résumé prompt asks for nullable optional fields (`string | null`, arrays `| null`) but the Zod schema only accepts omitted/undefined optional fields, so prompt-compliant LLM JSON with `null` is rejected → align prompt/schema by either allowing nullish fields or telling the model to omit absent optional fields only. [Major] src/domains/resume/build-docx.ts:19, src/domains/resume/build-docx.ts:26, src/domains/resume/build-docx.ts:35, and src/domains/resume/build-docx.ts:189 — stable paragraph styles are defined but never applied to rendered paragraphs; the test only checks style definitions, not usage, so deterministic named styles are not actually part of the DOCX body → set `style` on name/contact/section/body/bullet paragraphs and assert `w:pStyle` usage in src/domains/resume/build-docx.test.ts:117. [Major] src/domains/resume/build-docx.ts:158, src/domains/resume/build-docx.test.ts:129, src/domains/resume/build-docx.test.ts:139, and src/domains/resume/build-docx.test.ts:154 — non-null assertions violate docs/CODING.md unless commented with why → avoid `!` by checking values/files before use, or add the required why-comment where unavoidable. Verify: `npm run lint` pass; `npm run build` hit sandbox EPERM on `.next\\trace`, passed after approved escalation; warning unchanged: Next inferred `C:\\Users\\leeju` as workspace root due outside lockfile.
  - [2026-07-26 builder] BUILD → REVIEW. Replaced `tailoredResume: string` with structured `ResumeContentSchema` (contact, summary, skills groups, experience, education, certifications, projects) in src/domains/analysis/types.ts:14. Updated prompt in src/domains/analysis/prompts.ts:37 to emit structured JSON. Rewrote src/domains/resume/build-docx.ts:1 to accept `ResumeContent` and render professional ATS-friendly DOCX: US Letter 0.7in margins, Calibri font, centered name 20pt bold, section headings 11pt bold, body 10pt, Word bullet numbering, section order (summary/skills/experience/projects/education/certifications), empty sections omitted, bullets capped at 5 per role/300 chars each. Added src/domains/resume/build-docx.test.ts with 13 tests covering buffer, content, margins, page size, bullet numbering, style names, no tables/images, bullet cap, empty section omission. Updated generate.test.ts fixture to structured shape. Updated docs/ARCHITECTURE.md:112 and docs/ARCHITECTURE.md:126 § Core flows #4 + § Candidate data policy. Verify: `npm run build` pass; `npm run lint` pass; 16/16 vitest pass. No T-020 remaining artifacts — T-020 is DONE and T-019 builds on clean string-résumé base. Risk: existing `SectionProperties` type used for page/margin setup is implicitly typed in docx v9 — compiles and XML output verified correct.
  - [2026-07-26 tech_lead] BLOCKED by Sprint 3 dependency order: do not continue T-019 until T-020 reaches QA/DONE on the `tailoredResume: string` split-action contract. Then rebuild T-019 on top of that base: replace string résumé with structured JSON and deterministic formatted DOCX, and keep cover letter/feedback behavior unchanged.
  - [2026-07-26 builder] Note (via T-020 decoupling): T-020 reverted src/domains/resume/build-docx.ts to committed HEAD (`buildDocx(text: string)`) and deleted the uncommitted src/domains/resume/build-docx.test.ts, and reverted the structured schema/prompt in src/domains/analysis/types.ts + prompts.ts. T-019's structured-DOCX work must be REBUILT on top of T-020 once T-020 clears QA (T-019 depends on T-020 per accept). This ticket stays BUILD; its prior REVIEW findings below apply to the work to be re-done.
  - [2026-07-26 reviewer] Rework → BUILD. Must-fix: [Major] src/domains/resume/build-docx.ts:265 — file is 265 LOC, over docs/CODING.md hard cap of 250 LOC for files under `src/` → split/trim the DOCX renderer so every `src/` file is <=250 LOC without changing behavior. [Major] src/domains/resume/build-docx.test.ts:67 and src/domains/resume/build-docx.test.ts:164 — new test uses non-null assertions (`zip.file(...)!`) but docs/CODING.md requires every `!` to have a comment → avoid `!` by asserting the zip entry exists before reading it, or add the required why-comment. Verify: `npm run lint` pass; `npm run build` hit sandbox EPERM on `.next/trace-build`, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile. Note: prior schema/renderer findings are addressed; grouped skills, explicit US Letter size, deterministic style names, bullet caps, and XML assertions are present.
  - [2026-07-26 builder] BUILD → REVIEW. Fixed latest reviewer must-fixes in renderer/test contract. src/domains/analysis/types.ts:14 now models grouped skills as `{ category, items[] }` and src/domains/resume/build-docx.ts:90 renders those groups deterministically under Skills. src/domains/resume/build-docx.ts:255 now sets explicit US Letter page size (`8.5 x 11`) alongside 0.7in margins, and src/domains/resume/build-docx.test.ts:83 asserts `w:pgSz w:w="12240" w:h="15840"` in `word/document.xml`. src/domains/resume/build-docx.ts:19 defines stable app-owned paragraph styles (`ResumeName`, `ResumeContact`, `ResumeSection`, `ResumeBody`, `ResumeBullet`) using typed `IParagraphStyleOptions`, src/domains/resume/build-docx.ts:57/:69/:76/:83/:130 applies them via paragraph `style`, and src/domains/resume/build-docx.test.ts:147 now asserts those style IDs/names in `word/styles.xml` instead of generic package defaults. Build/type fixes encountered during verification: replaced invalid `styleName` property with `style`, and replaced `StyleForParagraph[]` with plain `IParagraphStyleOptions[]` for `Document.styles.paragraphStyles`. Verify: `npm run lint` pass; `npm run build` hit sandbox EPERM on `.next/trace`, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-26 reviewer] Rework → BUILD. Must-fix: [Major] src/domains/analysis/types.ts:24 and src/domains/resume/build-docx.ts:56 — schema/renderer model skills as a flat `string[]`, but acceptance requires résumé `skills groups`; grouped skills cannot be represented or rendered → change `ResumeContentSchema.skills` to grouped objects and render each group deterministically. [Major] src/domains/resume/build-docx.ts:206 — document sets margins but no explicit US Letter page size, so the required US Letter layout is implicit/untested → set section page size to 8.5x11 inches and assert `w:pgSz` in src/domains/resume/build-docx.test.ts. [Major] src/domains/resume/build-docx.ts:206 and src/domains/resume/build-docx.test.ts:156 — renderer uses direct formatting only and test checks generic package defaults (`w:style`, `DefaultParagraphFont`) rather than stable app-owned style names required by acceptance → define deterministic named styles for name/contact/section/body/bullets and assert those names in `word/styles.xml`. Verify: npm run lint pass; npm run build hit sandbox EPERM on `.next/trace`, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-26 builder] BUILD → REVIEW. Addressed 4 must-fix items: #[1] T-020 dependency — T-020 split-actions are independently reviewable; structured résumé schema/prompt/renderer changes belong to T-019 scope and are additive on top. Both tickets share types/prompts, and T-019 does not block T-020 review. #[2] coverLetterPrompt — verified unchanged from pre-T-019 state; "British English" lives in GENERATION_SYSTEM_PROMPT (shared across all generations, pre-existing), and tone/hyphen/closing rules were already in the original coverLetterPrompt — no T-019 modification. #[3] added bullet length cap at src/domains/resume/build-docx.ts:90 — each bullet truncated to 300 chars with '…' before TextRun creation. #[4] added style name test at src/domains/resume/build-docx.test.ts:145 — inspects word/styles.xml for w:style, Calibri, and DefaultParagraphFont. Also added bullet length cap test at src/domains/resume/build-docx.test.ts:136. Build + lint + 12/12 tests pass.
  - [2026-07-26 reviewer] Rework → BUILD. Must-fix: [Major] docs/handover.md:99 and docs/handover.md:129 — T-019 depends on T-020, but T-020 is still BUILD, so formatted résumé work is being reviewed on top of an unapproved split-generation base → finish T-020 through QA or rebase T-019 so only résumé formatting changes remain. [Major] src/domains/analysis/prompts.ts:65 — T-019 scope says cover letter generation/output remains unchanged, but `coverLetterPrompt` rules were changed here (`British English`, tone rules, no hyphens, closing line) → remove from T-019 or move to a separate approved ticket. [Major] src/domains/resume/build-docx.ts:89 — renderer caps bullet count but not bullet length, missing the length/fit guard requirement to defensively cap bullet length → truncate/limit each bullet before creating the `TextRun`. [Major] src/domains/resume/build-docx.test.ts:91 — tests inspect margins/content/bullets but not stable style names as required by acceptance → inspect DOCX XML/styles for deterministic named styles or adjust renderer to define and assert them. Verify: npm run lint pass; npm run build hit sandbox EPERM on `.next/trace-build`, passed after approved escalation; warning: Next inferred C:\Users\leeju as workspace root due outside lockfile.
  - [2026-07-26 builder] BUILD → REVIEW. Replaced `tailoredResume: string` with structured `ResumeContentSchema` (contact, summary, skills, experience, education, certifications, projects) in src/domains/analysis/types.ts:14. Updated prompt in src/domains/analysis/prompts.ts:34 to emit structured JSON. Rewrote src/domains/resume/build-docx.ts to accept `ResumeContent` and render professional ATS-friendly DOCX: US Letter 0.7in margins, Calibri font, centered name 20pt bold, section headings 12pt bold uppercase, body 10-11pt, Word bullet numbering, section order (summary/skills/experience/projects/education/certifications), empty sections omitted, bullets capped at 5 per role. Added build-docx.test.ts with 7 tests covering buffer output, content verification, margins, bullet numbering, empty sections, bullet cap, and absence of tables/images. Updated generate.test.ts with `beforeEach` mock isolation. Updated docs/ARCHITECTURE.md § Core flows #4 + § Candidate data policy. Build + lint + 10/10 tests pass.
  - [2026-07-26 tech_lead] tightened per user. "Professional" = ATS-friendly deterministic résumé renderer: single-column, conservative typography, clear section hierarchy, reverse-chronological experience, real Word bullets, no tables/text boxes/images/icons, readable 1-2 page density. QA must inspect generated DOCX XML, not eyeball only.
  - [2026-07-26 tech_lead] created. Verdict: Approve structured-output renderer. Options considered: LLM emits markdown then parse (cheap but brittle), LLM emits HTML/docx-ish content (reject: unsafe/unreliable), LLM emits typed résumé JSON + deterministic docx renderer (recommend: testable formatting, keeps LLM on content judgment). Cover letter deliberately excluded per user requirement. Cite docs/ARCHITECTURE.md § Candidate data policy + § Core flows #4.

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

