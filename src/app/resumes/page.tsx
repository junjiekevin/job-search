import { AppTabs } from '@/components/app-tabs'
import { ResumeManager } from '@/components/resume-manager'
import { listResumes } from '@/domains/resume/db'
import { uploadResumeAction, setSelectedAction, deleteResumeAction } from './actions'
import { logout } from '@/app/logout/actions'

export default async function ResumesPage(): Promise<React.JSX.Element> {
  const resumes = await listResumes()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My r&eacute;sum&eacute;s</h1>
        <p className="mt-2 text-gray-600">
          Upload up to 3 r&eacute;sum&eacute;s and choose the active one for grading.
        </p>
      </header>

      <section className="mt-6">
        <AppTabs activeTab="resumes" onLogout={logout} />
      </section>

      <section className="mt-8">
        <ResumeManager
          resumes={resumes}
          onUpload={uploadResumeAction}
          onSelect={setSelectedAction}
          onDelete={deleteResumeAction}
        />
      </section>
    </main>
  )
}
