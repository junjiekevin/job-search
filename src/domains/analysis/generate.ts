import { completeJSON } from '@/lib/ai/client'
import type { Job } from '@/domains/jobs/types'
import { TAILORING_SYSTEM_PROMPT, tailoringPrompt } from './prompts'
import { GenerationSchema, type Generation } from './types'

export async function generateTailoring(resumeText: string, job: Job): Promise<Generation> {
  const { data } = await completeJSON(
    TAILORING_SYSTEM_PROMPT,
    tailoringPrompt(resumeText, job),
    GenerationSchema
  )

  return data
}
