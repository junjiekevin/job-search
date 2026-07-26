import { completeJSON } from '@/lib/ai/client'
import type { Job } from '@/domains/jobs/types'
import { GENERATION_SYSTEM_PROMPT, coverLetterPrompt, feedbackPrompt, tailoredResumePrompt } from './prompts'
import { CoverLetterGenerationSchema, FeedbackGenerationSchema, ResumeGenerationSchema, type CoverLetterGeneration, type FeedbackGeneration, type ResumeGeneration } from './types'

type Usage = {
  usage: { promptTokens: number; completionTokens: number }
  model: string
}

export type GeneratedResume = ResumeGeneration & Usage
export type GeneratedCoverLetter = CoverLetterGeneration & Usage
export type GeneratedFeedback = FeedbackGeneration & Usage

function mapUsage(data: { prompt_tokens: number; completion_tokens: number }, model: string): Usage {
  return {
    usage: {
      promptTokens: data.prompt_tokens,
      completionTokens: data.completion_tokens,
    },
    model,
  }
}

export async function generateTailoredResume(resumeText: string, job: Job): Promise<GeneratedResume> {
  const { data, usage, model } = await completeJSON(
    GENERATION_SYSTEM_PROMPT,
    tailoredResumePrompt(resumeText, job),
    ResumeGenerationSchema
  )

  return {
    ...data,
    ...mapUsage(usage, model),
  }
}

export async function generateCoverLetter(resumeText: string, job: Job): Promise<GeneratedCoverLetter> {
  const { data, usage, model } = await completeJSON(
    GENERATION_SYSTEM_PROMPT,
    coverLetterPrompt(resumeText, job),
    CoverLetterGenerationSchema
  )

  return {
    ...data,
    ...mapUsage(usage, model),
  }
}

export async function generateFeedback(resumeText: string, job: Job): Promise<GeneratedFeedback> {
  const { data, usage, model } = await completeJSON(
    GENERATION_SYSTEM_PROMPT,
    feedbackPrompt(resumeText, job),
    FeedbackGenerationSchema
  )

  return {
    ...data,
    ...mapUsage(usage, model),
  }
}
