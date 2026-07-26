'use server'

import { buildDocx } from '@/domains/resume/build-docx'
import { getSelectedResume } from '@/domains/resume/db'
import { recordGeneration } from '@/domains/analysis/db'
import { generateTailoring } from '@/domains/analysis/generate'
import { saveApplication } from '@/domains/applications/db'
import { getJob } from '@/domains/jobs/db'
import type { Analysis } from '@/domains/analysis/types'
import { isApplicationStatus, type ApplicationInput, type SaveApplicationResult } from '@/domains/applications/types'

export type GenerateJobResult =
  | { ok: true; data: { analysis: Analysis; coverLetter: string; docxBase64: string } }
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

export async function generateJobApplication(jobId: string): Promise<GenerateJobResult> {
  if (!jobId) return { ok: false, error: 'Missing job ID.' }

  try {
    const [job, resume] = await Promise.all([getJob(jobId), getSelectedResume()])
    if (!job) return { ok: false, error: 'This job is no longer available.' }
    if (!resume) return { ok: false, error: 'Choose an active résumé before generating.' }
    if (!resume.extractedText?.trim()) {
      return { ok: false, error: 'The active résumé has no readable text. Upload another résumé.' }
    }

    const startedAt = performance.now()
    const generation = await generateTailoring(resume.extractedText, job)
    const docx = await buildDocx(generation.tailoredResume)

    await recordGeneration({
      jobId: job.id,
      resumeId: resume.id,
      kind: 'analysis',
      model: generation.model,
      promptTokens: generation.usage.promptTokens,
      completionTokens: generation.usage.completionTokens,
      durationMs: Math.round(performance.now() - startedAt),
    })

    return {
      ok: true,
      data: {
        analysis: generation.analysis,
        coverLetter: generation.coverLetter,
        docxBase64: docx.toString('base64'),
      },
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Generation failed')
    return { ok: false, error: 'Could not generate application materials.' }
  }
}
