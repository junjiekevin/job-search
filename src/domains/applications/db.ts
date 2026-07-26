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

export async function getApplication(jobId: string): Promise<Application | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('applications').select().eq('job_id', jobId).maybeSingle()

  if (error) throw error
  return data ? toApplication(data) : null
}

export async function listApplications(jobIds: string[]): Promise<Map<string, Application>> {
  if (jobIds.length === 0) return new Map()

  const supabase = await createClient()
  const { data, error } = await supabase.from('applications').select().in('job_id', jobIds)

  if (error) throw error
  return new Map(data.map(row => [row.job_id, toApplication(row)]))
}

export async function saveApplication(input: ApplicationInput): Promise<Application> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('applications')
    .upsert(
      {
        job_id: input.jobId,
        status: input.status,
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'job_id' }
    )
    .select()
    .single()

  if (error) throw error
  return toApplication(data)
}
