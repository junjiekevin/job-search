import { createHash } from 'node:crypto'
import { createClient } from '@/lib/db/server'
import type { Database } from '@/lib/db/types'
import type { Job, NormalizedJob } from './types'

type JobInsert = Database['public']['Tables']['jobs']['Insert']
type JobRow = Database['public']['Tables']['jobs']['Row']

export interface ListJobsOptions {
  search?: string
  sort?: 'newest' | 'oldest'
}

function toJob(job: JobRow): Job {
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    postingUrl: job.posting_url,
    applyUrl: job.apply_url,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    salaryCurrency: job.salary_currency,
    employmentType: job.employment_type,
    postedAt: job.posted_at,
  }
}

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function upsertJobs(jobs: NormalizedJob[]): Promise<number> {
  if (jobs.length === 0) return 0

  const seen = new Set<string>()
  const unique = jobs.filter(j => {
    if (seen.has(j.dedupe_hash)) return false
    seen.add(j.dedupe_hash)
    return true
  })

  const supabase = await createClient()
  const userId = await requireUserId(supabase)

  const rows: JobInsert[] = unique.map(j => ({
    user_id: userId,
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

  const { error } = await supabase
    .from('jobs')
    .upsert(rows, { onConflict: 'user_id, dedupe_hash', ignoreDuplicates: false })

  if (error) throw error
  return rows.length
}

export async function listJobs(options: ListJobsOptions = {}): Promise<Job[]> {
  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const search = options.search ? sanitizeSearchTerm(options.search) : undefined
  const sort = options.sort ?? 'newest'
  let query = supabase.from('jobs').select().eq('user_id', userId)

  if (options.search && !search) return []

  if (search) {
    query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`)
  }

  const { data, error } = await query.order('posted_at', {
    ascending: sort === 'oldest',
    nullsFirst: false,
  })

  if (error) throw error
  return data.map(toJob)
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const { data, error } = await supabase.from('jobs').select().eq('id', id).eq('user_id', userId).maybeSingle()

  if (error) throw error
  return data ? toJob(data) : null
}

function manualJobHash(title: string, company: string, location: string, description: string): string {
  const content = [title, company, location, description].map(value => value.trim().toLowerCase())
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}

export async function createManualJob(
  title: string,
  company: string,
  location: string,
  description: string,
): Promise<string> {
  const dedupeHash = manualJobHash(title, company, location, description)
  const supabase = await createClient()
  const userId = await requireUserId(supabase)
  const { data, error } = await supabase
    .from('jobs')
    .upsert({
      user_id: userId,
      source: 'manual',
      external_id: `manual-${dedupeHash}`,
      title: title.trim(),
      company: company.trim() || 'Not provided',
      location: location.trim() || null,
      description: description.trim(),
      posting_url: null,
      apply_url: null,
      dedupe_hash: dedupeHash,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'user_id, dedupe_hash' })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}
