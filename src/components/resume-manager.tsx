'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Resume } from '@/domains/resume/types'

interface ResumeManagerProps {
  resumes: Resume[]
  onUpload: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>
  onSelect: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>
  onDelete: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date))
}

export function ResumeManager({ resumes, onUpload, onSelect, onDelete }: ResumeManagerProps): React.JSX.Element {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleUpload(formData: FormData): void {
    startTransition(async () => {
      setError(null)
      const result = await onUpload(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      router.refresh()
    })
  }

  function handleAction(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    id: string,
  ): void {
    startTransition(async () => {
      setError(null)
      const formData = new FormData()
      formData.set('id', id)
      const result = await action(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      {resumes.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No r&eacute;sum&eacute;s yet. Upload a PDF or DOCX to get started.
        </p>
      )}

      {resumes.length > 0 && (
        <div className="grid gap-4">
          {resumes.map(resume => (
            <div key={resume.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-950">{resume.filename}</p>
                <p className="mt-1 text-sm text-gray-500">Uploaded {formatDate(resume.uploadedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {resume.isSelected ? (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Active</span>
                ) : (
                  <button
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => handleAction(onSelect, resume.id)}
                    type="button"
                  >
                    Select
                  </button>
                )}
                <button
                  className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => handleAction(onDelete, resume.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <form ref={formRef} action={handleUpload} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm font-medium text-gray-700">
            Upload r&eacute;sum&eacute;
            <input
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 disabled:opacity-50"
              disabled={isPending}
              name="file"
              required
              type="file"
            />
          </label>
          <button
            className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Uploading\u2026' : 'Upload'}
          </button>
        </form>
        {resumes.length >= 3 && (
          <p className="mt-2 text-sm text-amber-700">Maximum of 3 r&eacute;sum&eacute;s. Delete one to upload another.</p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  )
}
