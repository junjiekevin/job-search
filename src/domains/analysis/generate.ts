import { completeJSON } from '@/lib/ai/client'
import type { Job } from '@/domains/jobs/types'
import { TAILORING_SYSTEM_PROMPT, tailoringPrompt } from './prompts'
import { GenerationSchema, type Generation } from './types'

export type GeneratedTailoring = Generation & {
  usage: { promptTokens: number; completionTokens: number }
  model: string
}

export async function generateTailoring(resumeText: string, job: Job): Promise<GeneratedTailoring> {
  const { data, usage, model } = await completeJSON(
    TAILORING_SYSTEM_PROMPT,
    tailoringPrompt(resumeText, job),
    GenerationSchema
  )

  return {
    ...data,
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    },
    model,
  }
}
