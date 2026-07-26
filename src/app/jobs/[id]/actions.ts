'use server'

import { buildDocx } from '@/domains/resume/build-docx'
import { getSelectedResume } from '@/domains/resume/db'
import { recordGeneration } from '@/domains/analysis/db'
import { generateCoverLetter, generateFeedback, generateTailoredResume } from '@/domains/analysis/generate'
import { saveApplication } from '@/domains/applications/db'
import { getJob } from '@/domains/jobs/db'
import type { FeedbackGeneration } from '@/domains/analysis/types'
import { isApplicationStatus, type ApplicationInput, type SaveApplicationResult } from '@/domains/applications/types'

type GenerateResumeResult =
  | { ok: true; data: { docxBase64: string } }
  | { ok: false; error: string }

type GenerateCoverLetterResult =
  | { ok: true; data: { coverLetter: string } }
  | { ok: false; error: string }

type GenerateFeedbackResult =
  | { ok: true; data: FeedbackGeneration }
  | { ok: false; error: string }

function isApplicationInput(input: unknown): input is ApplicationInput {
  if (typeof input !== 'object' || input === null) return false

  const fields = input as { jobId?: unknown; status?: unknown; notes?: unknown }
  return typeof fields.jobId === 'string'
    && typeof fields.notes === 'string'
    && typeof fields.status === 'string'
    && isApplicationStatus(fields.status)
}

export async function saveJobApplication(input: unknown): Promise<SaveApplicationResult> {
  try {
    if (!isApplicationInput(input)) {
      return { ok: false, error: 'Enter a valid application status and notes.' }
    }

    const application = await saveApplication(input)
    return { ok: true, data: application }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Application update failed')
    return { ok: false, error: 'Could not save application tracking.' }
  }
}

async function loadGenerationContext(jobId: string): Promise<
  | { ok: true; data: { job: Awaited<ReturnType<typeof getJob>> extends infer T ? Exclude<T, null> : never; resumeId: string; resumeText: string } }
  | { ok: false; error: string }
> {
  if (!jobId) return { ok: false, error: 'Missing job ID.' }

  const [job, resume] = await Promise.all([getJob(jobId), getSelectedResume()])
  if (!job) return { ok: false, error: 'This job is no longer available.' }
  if (!resume) return { ok: false, error: 'Choose an active résumé before generating.' }
  if (!resume.extractedText?.trim()) {
    return { ok: false, error: 'The active résumé has no readable text. Upload another résumé.' }
  }

  return { ok: true, data: { job, resumeId: resume.id, resumeText: resume.extractedText } }
}

export async function generateResume(jobId: string): Promise<GenerateResumeResult> {
  try {
    const context = await loadGenerationContext(jobId)
    if (!context.ok) return context

    const startedAt = performance.now()
    const generation = await generateTailoredResume(context.data.resumeText, context.data.job)
    const docx = await buildDocx(generation.tailoredResume)

    await recordGeneration({
      jobId: context.data.job.id,
      resumeId: context.data.resumeId,
      kind: 'resume',
      model: generation.model,
      promptTokens: generation.usage.promptTokens,
      completionTokens: generation.usage.completionTokens,
      durationMs: Math.round(performance.now() - startedAt),
    })

    return { ok: true, data: { docxBase64: docx.toString('base64') } }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Resume generation failed')
    return { ok: false, error: 'Could not generate a tailored résumé.' }
  }
}

export async function generateLetter(jobId: string): Promise<GenerateCoverLetterResult> {
  try {
    const context = await loadGenerationContext(jobId)
    if (!context.ok) return context

    const startedAt = performance.now()
    const generation = await generateCoverLetter(context.data.resumeText, context.data.job)

    await recordGeneration({
      jobId: context.data.job.id,
      resumeId: context.data.resumeId,
      kind: 'cover_letter',
      model: generation.model,
      promptTokens: generation.usage.promptTokens,
      completionTokens: generation.usage.completionTokens,
      durationMs: Math.round(performance.now() - startedAt),
    })

    return { ok: true, data: { coverLetter: generation.coverLetter } }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Cover letter generation failed')
    return { ok: false, error: 'Could not generate a cover letter.' }
  }
}

export async function generateFeedbackAction(jobId: string): Promise<GenerateFeedbackResult> {
  try {
    const context = await loadGenerationContext(jobId)
    if (!context.ok) return context

    const startedAt = performance.now()
    const generation = await generateFeedback(context.data.resumeText, context.data.job)

    await recordGeneration({
      jobId: context.data.job.id,
      resumeId: context.data.resumeId,
      kind: 'analysis',
      model: generation.model,
      promptTokens: generation.usage.promptTokens,
      completionTokens: generation.usage.completionTokens,
      durationMs: Math.round(performance.now() - startedAt),
    })

    return {
      ok: true,
      data: {
        rating: generation.rating,
        rationale: generation.rationale,
        strengths: generation.strengths,
        gaps: generation.gaps,
        improvements: generation.improvements,
        suggestions: generation.suggestions,
      },
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Feedback generation failed')
    return { ok: false, error: 'Could not generate feedback and rating.' }
  }
}
