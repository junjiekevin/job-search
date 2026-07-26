import { AppTabs } from '@/components/app-tabs'
import { JobCard } from '@/components/job-card'
import { PasteJobForm } from '@/components/paste-job-form'
import { JobSearchForm } from '@/components/job-search-form'
import { redirect } from 'next/navigation'
import { createManualJobAction, searchJobs } from '@/app/actions'
import { logout } from '@/app/logout/actions'
import { APPLICATION_STATUSES, isApplicationStatus, type ApplicationStatus } from '@/domains/applications/types'
import { listApplications } from '@/domains/applications/db'
import { listJobs, type ListJobsOptions } from '@/domains/jobs/db'
import { createClient } from '@/lib/db/server'

interface DashboardPageProps {
  searchParams: Promise<{ q?: string; sort?: string; status?: string; searchKey?: string }>
}

function parseOptions(params: { q?: string; sort?: string; status?: string; searchKey?: string }): ListJobsOptions & { status?: ApplicationStatus } {
  return {
    search: params.q,
    sort: params.sort === 'oldest' ? 'oldest' : 'newest',
    status: params.status && isApplicationStatus(params.status) ? params.status : undefined,
    searchKey: params.searchKey,
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const options = parseOptions(params)
  let allJobs = [] as Awaited<ReturnType<typeof listJobs>>
  let applications = new Map<string, Awaited<ReturnType<typeof listApplications>> extends Map<string, infer T> ? T : never>()
  let jobsError: string | null = null

  try {
    allJobs = await listJobs(options)
    applications = await listApplications(allJobs.map(job => job.id))
  } catch (error) {
    const message = error instanceof Error ? error.message
      : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message)
      : 'Dashboard jobs load failed'
    console.error(`Dashboard jobs load failed: ${message}`)
    jobsError = 'We could not load your jobs right now. If this continues, apply the latest database migration and try again.'
  }

  const jobs = jobsError
    ? []
    : options.status ? allJobs.filter(job => applications.get(job.id)?.status === options.status) : allJobs

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-blue-700">Job search</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Find your next role</h1>
        <p className="mt-3 text-gray-600">Search live listings, then keep the opportunities worth pursuing in one place.</p>
      </header>

      <section className="mt-6">
        <AppTabs activeTab="jobs" onLogout={logout} />
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <JobSearchForm onSearch={searchJobs} />
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5" id="paste-job">
        <h2 className="text-xl font-semibold">Paste a job description</h2>
        <p className="mt-1 text-sm text-gray-600">Save a role you found elsewhere and tailor your application to it.</p>
        <div className="mt-4">
          <PasteJobForm onCreate={createManualJobAction} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Jobs</h2>
            <p className="mt-1 text-sm text-gray-500">{jobs.length} matching listing{jobs.length === 1 ? '' : 's'}</p>
          </div>
          <form className="flex flex-wrap gap-3" method="get">
            {params.searchKey && <input name="searchKey" type="hidden" value={params.searchKey} />}
            <label className="text-sm font-medium text-gray-700">
              Filter
              <input
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 font-normal"
                defaultValue={options.search}
                name="q"
                placeholder="Title or company"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Sort
              <select className="mt-1 block rounded-md border border-gray-300 px-3 py-2 font-normal" defaultValue={options.sort} name="sort">
                <option value="newest">Newest posted</option>
                <option value="oldest">Oldest posted</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Status
              <select className="mt-1 block rounded-md border border-gray-300 px-3 py-2 font-normal" defaultValue={options.status ?? ''} name="status">
                <option value="">All statuses</option>
                {APPLICATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white" type="submit">Apply</button>
          </form>
        </div>

        <div className="mt-5 grid gap-4">
          {jobsError && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{jobsError}</p>}
          {jobs.map(job => <JobCard job={job} key={job.id} status={applications.get(job.id)?.status ?? null} />)}
          {!jobsError && jobs.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">No jobs yet. Search by keyword to add fresh listings.</p>}
        </div>
      </section>
    </main>
  )
}
