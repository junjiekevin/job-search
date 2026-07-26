import { z } from 'zod'
import type { SearchProvider, NormalizedJob } from '../types'
import { normalizeJob } from '../normalize'

const ReedJobSchema = z.object({
  jobId: z.number(),
  employerName: z.string(),
  jobTitle: z.string(),
  description: z.string(),
  locationName: z.string().nullable().optional(),
  minimumSalary: z.number().nullable().optional(),
  maximumSalary: z.number().nullable().optional(),
  yearlyMinimumSalary: z.number().nullable().optional(),
  yearlyMaximumSalary: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  contractType: z.string().nullable().optional(),
  jobType: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  jobUrl: z.string().nullable().optional(),
})

const ReedResponseSchema = z.object({
  results: z.array(ReedJobSchema),
})

function mapEmploymentType(contractType: string | null | undefined, jobType: string | null | undefined): string | null {
  const types: string[] = []
  if (contractType) types.push(contractType.toLowerCase())
  if (jobType) types.push(jobType.toLowerCase().replace(' ', '-'))
  return types.length > 0 ? types.join(', ') : null
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
      description: job.description,
      posting_url: job.jobUrl ?? null,
      apply_url: job.jobUrl ?? null,
      salary_min: job.yearlyMinimumSalary ?? job.minimumSalary ?? null,
      salary_max: job.yearlyMaximumSalary ?? job.maximumSalary ?? null,
      salary_currency: job.currency ?? null,
      employment_type: mapEmploymentType(job.contractType, job.jobType),
      posted_at: null,
    }))
  },
}
