'use server'

import { createHash } from 'node:crypto'
import { adzuna } from '@/domains/jobs/providers/adzuna'
import { reed } from '@/domains/jobs/providers/reed'
import { createManualJob, upsertJobs } from '@/domains/jobs/db'
import type { SearchParams } from '@/domains/jobs/types'

function computeSearchKey(params: SearchParams): string {
  const raw = [
    params.what.toLowerCase().trim(),
    (params.where ?? '').toLowerCase().trim(),
    (params.country ?? 'gb').toLowerCase().trim(),
    String(params.page ?? 1),
  ]
  return createHash('sha256').update(JSON.stringify(raw)).digest('hex')
}

export async function searchJobs(params: SearchParams): Promise<{ ok: true; data: { count: number; searchKey: string } } | { ok: false; error: string }> {
  try {
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

    const searchKey = computeSearchKey(params)
    const count = await upsertJobs(jobs, searchKey)
    return { ok: true, data: { count, searchKey } }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Job search failed')
    return { ok: false, error: 'Could not refresh jobs right now. Please try again.' }
  }
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
