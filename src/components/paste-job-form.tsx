'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface PasteJobFormProps {
  onCreate: (formData: FormData) => Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }>
}

export function PasteJobForm({ onCreate }: PasteJobFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      setError(null)
      const result = await onCreate(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/jobs/${result.data.id}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          Job title
          <input className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="title" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Company <span className="font-normal text-gray-500">(optional)</span>
          <input className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="company" />
        </label>
      </div>
      <label className="block text-sm font-medium text-gray-700">
        Location <span className="font-normal text-gray-500">(optional)</span>
        <input className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="location" />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Job description
        <textarea className="mt-1 block min-h-40 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="description" required />
      </label>
      <div className="flex items-center gap-3">
        <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
          {isPending ? 'Saving…' : 'Save job'}
        </button>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      </div>
    </form>
  )
}
