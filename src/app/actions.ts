'use server'

import { adzuna } from '@/domains/jobs/providers/adzuna'
import { reed } from '@/domains/jobs/providers/reed'
import { createManualJob, upsertJobs } from '@/domains/jobs/db'
import type { SearchParams } from '@/domains/jobs/types'

export async function searchJobs(params: SearchParams): Promise<{ ok: true; data: { count: number } } | { ok: false; error: string }> {
  const providers = [adzuna, reed]
  const allJobs = await Promise.allSettled(
    providers.map(p => p.search(params))
  )

  const jobs = allJobs.flatMap((result, i) => {
    if (result.status === 'fulfilled') return result.value
    console.error(`${i === 0 ? 'Adzuna' : 'Reed'} search failed: ${result.reason?.message ?? 'unknown'}`)
    return []
  })

  if (jobs.length === 0) {
    const allFailed = allJobs.every(r => r.status === 'rejected')
    if (allFailed) return { ok: false, error: 'No job sources returned results' }
  }

  const count = await upsertJobs(jobs)
  return { ok: true, data: { count } }
}

export async function createManualJobAction(
  formData: FormData,
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  const title = formData.get('title')
  const company = formData.get('company')
  const location = formData.get('location')
  const description = formData.get('description')

  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
    return { ok: false, error: 'Enter a title and job description.' }
  }
  if (typeof company !== 'string' || typeof location !== 'string') {
    return { ok: false, error: 'Enter valid job details.' }
  }

  try {
    const id = await createManualJob(title, company, location, description)
    return { ok: true, data: { id } }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Manual job creation failed')
    return { ok: false, error: 'Could not save this job.' }
  }
}
