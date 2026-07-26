import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GeneratePanel } from '@/components/generate-panel'
import { StatusSelect } from '@/components/status-select'
import { getApplication } from '@/domains/applications/db'
import { getJob } from '@/domains/jobs/db'
import { getSelectedResume } from '@/domains/resume/db'
import { generateJobApplication, saveJobApplication } from './actions'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string | null {
  if (min === null && max === null) return null

  const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: currency ?? 'USD', maximumFractionDigits: 0 })
  if (min !== null && max !== null) return `${formatter.format(min)}–${formatter.format(max)}`
  return formatter.format(min ?? max ?? 0)
}

export default async function JobDetailPage({ params }: JobDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()
  const [application, selectedResume] = await Promise.all([getApplication(job.id), getSelectedResume()])

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm font-medium text-blue-700 hover:underline" href="/">← All jobs</Link>
      <article className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">{job.source}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{job.title}</h1>
            <p className="mt-2 text-lg text-gray-600">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
          </div>
          <div className="flex gap-3">
            {job.postingUrl && <a className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium" href={job.postingUrl} rel="noreferrer" target="_blank">View posting</a>}
            {job.applyUrl && <a className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white" href={job.applyUrl} rel="noreferrer" target="_blank">Apply</a>}
          </div>
        </div>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-y border-gray-200 py-5 text-sm">
          {salary && <div><dt className="text-gray-500">Salary</dt><dd className="mt-1 font-medium">{salary}</dd></div>}
          {job.employmentType && <div><dt className="text-gray-500">Employment type</dt><dd className="mt-1 font-medium capitalize">{job.employmentType}</dd></div>}
        </dl>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-700">{job.description ?? 'No description was provided for this listing.'}</p>
        </section>
        <StatusSelect application={application} jobId={job.id} onSave={saveJobApplication} />
        <GeneratePanel
          activeResume={selectedResume ? { filename: selectedResume.filename } : null}
          jobId={job.id}
          onGenerate={generateJobApplication}
        />
      </article>
    </main>
  )
}
