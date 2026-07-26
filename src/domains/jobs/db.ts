import { createClient } from '@/lib/db/server'
import type { Database } from '@/lib/db/types'
import type { NormalizedJob } from './types'

type JobInsert = Database['public']['Tables']['jobs']['Insert']

export async function upsertJobs(jobs: NormalizedJob[]): Promise<number> {
  if (jobs.length === 0) return 0

  const supabase = await createClient()

  const rows: JobInsert[] = jobs.map(j => ({
    source: j.source,
    external_id: j.external_id,
    title: j.title,
    company: j.company,
    location: j.location,
    description: j.description,
    posting_url: j.posting_url,
    apply_url: j.apply_url,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    salary_currency: j.salary_currency,
    employment_type: j.employment_type,
    posted_at: j.posted_at,
    dedupe_hash: j.dedupe_hash,
    fetched_at: new Date().toISOString(),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('jobs') as any)
    .upsert(rows, { onConflict: 'dedupe_hash', ignoreDuplicates: false })

  if (error) throw error
  return rows.length
}
