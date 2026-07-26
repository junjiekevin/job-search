# AI-Powered Personal Job Dashboard

## Project Overview

Build a lightweight, AI-first web application that simplifies the job
application process for a single user. The goal is not to build another
job board or recruitment platform, but rather a personal assistant that
aggregates relevant jobs into one dashboard, helps tailor resumes to
individual job postings, and tracks application progress.

The application should prioritize simplicity, speed, and usability over
feature richness. Every design decision should minimize complexity for
both the end user and the development process.

This project is intended for personal use (initially for a single user,
with the possibility of supporting a few users in the future). It is
**not** intended to become a commercial SaaS platform.

------------------------------------------------------------------------

## Core Philosophy

The application should embody the following principles:

-   Lightweight
-   Fast
-   AI-first
-   Minimal configuration
-   Clean and intuitive UI
-   Easy to use
-   Few clicks to accomplish common tasks
-   Mobile-friendly where practical
-   Easy to maintain
-   Modular architecture
-   Easily extensible without major rewrites

The user should be able to understand how to use the application within
a minute of opening it.

Avoid unnecessary configuration screens, complicated onboarding flows,
or enterprise-style features.

------------------------------------------------------------------------

## Primary Goal

Reduce the time and effort required to search, prepare, and apply for
jobs by centralizing the workflow into a single application.

The application should automate repetitive work while keeping the user
fully in control of reviewing, editing, and submitting applications.

------------------------------------------------------------------------

## Intended Workflow

1.  Upload up to 3 resumes (PDF/DOCX) and select the active one.
2.  Search jobs by keyword (and optional location) across supported sources,
    or paste a job description to add it directly.
3.  Display all relevant jobs in a single dashboard; filter and sort.
4.  Select a job.
5.  Grade the selected resume against the job with an LLM.
6.  Generate an AI analysis/advice, tailored resume, and cover letter.
7.  Download the generated documents (DOCX) for manual review and editing.
8.  Open the employer's official application page.
9.  Update the application's status.

The application assists the user---it does not replace them.

------------------------------------------------------------------------

## Core Features

### Job Aggregation

-   Search jobs by keyword + location across providers (Adzuna, Reed) —
    cross-industry, not tech-only.
-   Normalize data into a common format (title, company, location, salary,
    employment type, links).
-   Remove duplicate listings across sources.
-   Store historical listings.
-   Preserve direct application links.
-   Search on demand (scheduled refreshes may be added later).

The user should not need to know where a job originated.

### Unified Job Dashboard

Provide a clean, simple dashboard that supports:

-   Search
-   Basic filtering
-   Sorting
-   Viewing job details
-   Pasting a job description to add a job directly
-   Opening the original posting
-   Opening the employer's application page
-   Viewing and updating application status

### Resume Management

-   Upload up to 3 resumes (PDF or DOCX); stored privately.
-   Switch the active resume at any time — the selected one is graded.
-   Replace or delete a resume at any time.
-   Only the resume files + extracted text are stored; AI outputs are not.

### AI Job Analysis

Use an LLM to identify:

-   Primary responsibilities
-   Required skills
-   Preferred skills
-   Technologies
-   Experience expectations
-   Resume improvement opportunities
-   Missing qualifications
-   Areas of strong alignment

Prioritize concise, actionable insights.

### AI Resume Tailoring

Generate a tailored resume and cover letter using:

-   The resume provided for this generation
-   The selected job description

Requirements:

-   Never fabricate experience.
-   Preserve factual accuracy.
-   Improve wording where appropriate.
-   Highlight relevant experience.
-   Reorder content for relevance.
-   Produce an editable document for download.

### Application Tracking

Provide lightweight tracking using statuses such as:

-   Saved
-   Applying
-   Applied
-   Interview
-   Offer
-   Rejected
-   Archived

Optional notes may be attached.

------------------------------------------------------------------------

## Artificial Intelligence Strategy

Adopt an **LLM-first** philosophy.

The LLM should handle:

-   Job understanding
-   Resume analysis
-   Resume tailoring
-   Summarization
-   Suggestions
-   Future AI-driven enhancements

Traditional application logic should handle:

-   Data retrieval
-   Storage
-   Authentication
-   Filtering
-   Searching
-   Deduplication
-   File management
-   State management

Use deterministic code whenever AI is unnecessary.

### Model Requirements

Prioritize:

-   Low latency
-   Low cost
-   High throughput

Preferred models:

-   deepseek/deepseek-v4-flash
-   google/gemma-4-26b-a4b-it
-   openai/gpt-5-mini


Design the application so the AI provider can be replaced with minimal
changes.

------------------------------------------------------------------------

## User Experience

The interface should remain intentionally simple.

Guiding principles:

-   One primary dashboard
-   Minimal navigation
-   Few dialogs
-   Clear actions
-   Consistent layout
-   Fast interactions
-   Limited visual clutter

The application should feel like a productivity tool, not an enterprise
platform.

------------------------------------------------------------------------

## Preferred Technology Stack

The technical lead is responsible for final implementation decisions.

### Frontend

-   Next.js
-   React
-   TypeScript

### Backend

-   Next.js Server Actions / API Routes

### Database

-   PostgreSQL (Supabase)

### Storage

-   Supabase Storage (private) for uploaded resume files.
-   Generated documents are built in memory and downloaded directly, never stored.

### Hosting

-   Vercel

### Authentication

-   Supabase Auth (or an equivalent lightweight solution)

### Artificial Intelligence

-   OpenAI GPT mini

### Document Generation

-   DOCX generation library

### ORM

-   At the technical lead's discretion.

------------------------------------------------------------------------

## Architecture Principles

Prioritize:

-   Simplicity
-   Separation of concerns
-   Modular services
-   Testability
-   Easy deployment
-   Scalability without premature optimization

Avoid over-engineering.

The project should remain maintainable by a single developer.

------------------------------------------------------------------------

## Non-Goals

The following are intentionally out of scope for the MVP:

-   Automatic job applications
-   Autonomous AI agents
-   Browser automation
-   Multi-agent orchestration
-   Enterprise workflows
-   Social networking features
-   Interview coaching
-   Salary prediction
-   Analytics dashboards
-   Complex recommendation engines
-   Large-scale user management
-   Advanced notification systems
-   Extensive customization
-   Workflow builders

------------------------------------------------------------------------

## Success Criteria

The MVP is successful if a user can:

-   Refresh and browse jobs from multiple supported sources.
-   Search and filter opportunities.
-   View the original job posting.
-   Generate a tailored resume and cover letter.
-   Download the generated documents for manual editing.
-   Open the employer's application page directly.
-   Track application progress.

If those tasks can be completed quickly through a clean, intuitive
interface with minimal effort, the project has achieved its primary
objective.
