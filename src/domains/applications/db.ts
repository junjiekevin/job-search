import { createClient } from '@/lib/db/server'
import type { Database } from '@/lib/db/types'
import type { Application, ApplicationInput } from './types'

type ApplicationRow = Database['public']['Tables']['applications']['Row']

function toApplication(row: ApplicationRow): Application {
  return {
    jobId: row.job_id,
    status: row.status,
    notes: row.notes ?? '',
    updatedAt: row.updated_at,
  }
}

async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function getApplication(jobId: string): Promise<Application | null> {
  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const { data, error } = await supabase.from('applications').select().eq('job_id', jobId).eq('user_id', userId).maybeSingle()

  if (error) throw new Error(error.message)
  return data ? toApplication(data) : null
}

export async function listApplications(jobIds: string[]): Promise<Map<string, Application>> {
  if (jobIds.length === 0) return new Map()

  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const { data, error } = await supabase.from('applications').select().in('job_id', jobIds).eq('user_id', userId)

  if (error) throw new Error(error.message)
  return new Map(data.map(row => [row.job_id, toApplication(row)]))
}

export async function saveApplication(input: ApplicationInput): Promise<Application> {
  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const { data, error } = await supabase
    .from('applications')
    .upsert(
      {
        user_id: userId,
        job_id: input.jobId,
        status: input.status,
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, job_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toApplication(data)
}
