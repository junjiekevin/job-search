import { createClient } from '@/lib/db/server'
import type { GenerationKind } from '@/lib/db/types'

export interface GenerationMetrics {
  jobId: string
  resumeId: string
  kind: GenerationKind
  model: string
  promptTokens: number
  completionTokens: number
  durationMs: number
}

export async function recordGeneration(metrics: GenerationMetrics): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('generations').insert({
    user_id: user.id,
    job_id: metrics.jobId,
    resume_id: metrics.resumeId,
    kind: metrics.kind,
    model: metrics.model,
    prompt_tokens: metrics.promptTokens,
    completion_tokens: metrics.completionTokens,
    duration_ms: metrics.durationMs,
  })

  if (error) throw error
}
