import { z } from 'zod'
import type { SearchProvider, NormalizedJob } from '../types'
import { normalizeJob } from '../normalize'

const ReedJobSchema = z.object({
  jobId: z.number(),
  employerName: z.string(),
  jobTitle: z.string(),
  description: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  minimumSalary: z.number().nullable().optional(),
  maximumSalary: z.number().nullable().optional(),
  yearlyMinimumSalary: z.number().nullable().optional(),
  yearlyMaximumSalary: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  contractType: z.string().nullable().optional(),
  jobType: z.string().nullable().optional(),
  fullTime: z.boolean().nullable().optional(),
  partTime: z.boolean().nullable().optional(),
  contract: z.boolean().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
})

const ReedResponseSchema = z.object({
  results: z.array(ReedJobSchema),
})

function mapEmploymentType(
  fullTime: boolean | null | undefined,
  partTime: boolean | null | undefined,
  contract: boolean | null | undefined,
  contractType: string | null | undefined,
  jobType: string | null | undefined,
): string | null {
  const parts: string[] = []
  if (contract === true || contractType === 'contract') parts.push('contract')
  if (contractType === 'permanent') parts.push('permanent')
  if (contractType === 'temporary') parts.push('temporary')
  if (fullTime === true || jobType === 'Full Time') parts.push('full-time')
  if (partTime === true || jobType === 'Part Time') parts.push('part-time')
  const unique = [...new Set(parts)]
  return unique.length > 0 ? unique.join(', ') : null
}

export const reed: SearchProvider = {
  async search({ what, where, page = 1 }): Promise<NormalizedJob[]> {
    if (!process.env.REED_API_KEY) {
      throw new Error('Reed: missing REED_API_KEY')
    }

    const url = new URL('https://www.reed.co.uk/api/1.0/search')
    url.searchParams.set('keywords', what)
    if (where) url.searchParams.set('locationName', where)
    const resultsToSkip = (page - 1) * 100
    url.searchParams.set('resultsToSkip', String(resultsToSkip))
    url.searchParams.set('resultsToTake', '100')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.REED_API_KEY}:`).toString('base64')}`,
      },
    })
    if (!res.ok) throw new Error(`Reed: HTTP ${res.status}`)

    const raw = ReedResponseSchema.parse(await res.json())

    return raw.results.map(job => normalizeJob({
      source: 'reed',
      external_id: String(job.jobId),
      title: job.jobTitle,
      company: job.employerName,
      location: job.locationName ?? null,
      description: job.description ?? null,
      posting_url: `https://www.reed.co.uk/jobs/${job.jobId}`,
      apply_url: `https://www.reed.co.uk/jobs/${job.jobId}`,
      salary_min: job.yearlyMinimumSalary ?? job.minimumSalary ?? null,
      salary_max: job.yearlyMaximumSalary ?? job.maximumSalary ?? null,
      salary_currency: job.currency ?? null,
      employment_type: mapEmploymentType(job.fullTime, job.partTime, job.contract, job.contractType, job.jobType),
      posted_at: null,
    }))
  },
}
