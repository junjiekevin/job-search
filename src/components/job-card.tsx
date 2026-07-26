import Link from 'next/link'
import type { Job } from '@/domains/jobs/types'
import type { ApplicationStatus } from '@/domains/applications/types'

interface JobCardProps {
  job: Job
  status: ApplicationStatus | null
}

function formatSalary(job: Job): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null

  const currency = job.salaryCurrency ?? 'USD'
  const formatter = new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 })
  if (job.salaryMin !== null && job.salaryMax !== null) return `${formatter.format(job.salaryMin)}–${formatter.format(job.salaryMax)}`
  return formatter.format(job.salaryMin ?? job.salaryMax ?? 0)
}

function formatDate(date: string | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date))
}

export function JobCard({ job, status }: JobCardProps): React.JSX.Element {
  const salary = formatSalary(job)
  const postedAt = formatDate(job.postedAt)

  return (
    <Link className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm" href={`/jobs/${job.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-950">{job.title}</h3>
          <p className="mt-1 text-gray-600">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">{job.source}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
        {salary && <span>{salary}</span>}
        {postedAt && <span>Posted {postedAt}</span>}
        <span>{status ? `Status: ${status}` : 'Not tracked'}</span>
      </div>
    </Link>
  )
}
