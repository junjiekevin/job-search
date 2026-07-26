import { z } from 'zod'
import type { SearchProvider, NormalizedJob } from '../types'
import { normalizeJob } from '../normalize'

const AdzunaJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  created: z.string(),
  redirect_url: z.string(),
  company: z.object({ display_name: z.string() }),
  location: z.object({ display_name: z.string() }).optional(),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  salary_is_predicted: z.enum(['0', '1']).optional(),
  contract_time: z.enum(['full_time', 'part_time']).nullable().optional(),
  contract_type: z.enum(['permanent', 'contract']).nullable().optional(),
})

const AdzunaResponseSchema = z.object({
  results: z.array(AdzunaJobSchema),
})

const COUNTRY_CURRENCY: Record<string, string> = {
  gb: 'GBP', us: 'USD', at: 'EUR', au: 'AUD', be: 'EUR', br: 'BRL',
  ca: 'CAD', ch: 'CHF', de: 'EUR', es: 'EUR', fr: 'EUR', in: 'INR',
  it: 'EUR', mx: 'MXN', nl: 'EUR', nz: 'NZD', pl: 'PLN', sg: 'SGD', za: 'ZAR',
}

function mapEmploymentType(contractTime: string | null | undefined, contractType: string | null | undefined): string | null {
  if (contractTime === 'full_time') return 'full-time'
  if (contractTime === 'part_time') return 'part-time'
  if (contractType === 'permanent') return 'permanent'
  if (contractType === 'contract') return 'contract'
  return null
}

export const adzuna: SearchProvider = {
  async search({ what, where, country = 'gb', page = 1 }): Promise<NormalizedJob[]> {
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_API_KEY) {
      throw new Error('Adzuna: missing ADZUNA_APP_ID or ADZUNA_API_KEY')
    }

    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`)
    url.searchParams.set('app_id', process.env.ADZUNA_APP_ID)
    url.searchParams.set('app_key', process.env.ADZUNA_API_KEY)
    url.searchParams.set('what', what)
    url.searchParams.set('results_per_page', '50')
    if (where) url.searchParams.set('where', where)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Adzuna: HTTP ${res.status}`)

    const raw = AdzunaResponseSchema.parse(await res.json())
    const currency = COUNTRY_CURRENCY[country] ?? null

    return raw.results.map(job => normalizeJob({
      source: 'adzuna',
      external_id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location?.display_name ?? null,
      description: job.description,
      posting_url: job.redirect_url,
      apply_url: job.redirect_url,
      salary_min: job.salary_is_predicted === '0' ? (job.salary_min ?? null) : null,
      salary_max: job.salary_is_predicted === '0' ? (job.salary_max ?? null) : null,
      salary_currency: currency,
      employment_type: mapEmploymentType(job.contract_time, job.contract_type),
      posted_at: job.created,
    }))
  },
}
