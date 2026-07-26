import { createHash } from 'node:crypto'
import type { NormalizedJob } from './types'

export function dedupeHash(company: string, title: string, location: string | null): string {
  const raw = [company, title, location ?? '']
    .map(s => s.toLowerCase().trim())
    .join('|')
  return createHash('sha256').update(raw).digest('hex')
}

export function normalizeJob(job: Omit<NormalizedJob, 'dedupe_hash'>): NormalizedJob {
  return {
    ...job,
    dedupe_hash: dedupeHash(job.company, job.title, job.location),
  }
}
