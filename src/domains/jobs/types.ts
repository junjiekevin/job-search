export interface SearchParams {
  what: string
  where?: string
  country?: string
  page?: number
}

export interface SearchProvider {
  search(params: SearchParams): Promise<NormalizedJob[]>
}

export interface NormalizedJob {
  source: string
  external_id: string
  title: string
  company: string
  location: string | null
  description: string | null
  posting_url: string | null
  apply_url: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  employment_type: string | null
  posted_at: string | null
  dedupe_hash: string
}

export interface Job {
  id: string
  source: string
  title: string
  company: string
  location: string | null
  description: string | null
  postingUrl: string | null
  applyUrl: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  employmentType: string | null
  postedAt: string | null
}
