'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchParams } from '@/domains/jobs/types'

interface JobSearchFormProps {
  onSearch: (params: SearchParams) => Promise<{ ok: true; data: { count: number } } | { ok: false; error: string }>
}

export function JobSearchForm({ onSearch }: JobSearchFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData): void {
    const what = formData.get('what')
    const where = formData.get('where')

    if (typeof what !== 'string' || !what.trim()) {
      setError('Enter a keyword to search.')
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await onSearch({
        what: what.trim(),
        where: typeof where === 'string' && where.trim() ? where.trim() : undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-52 flex-1 text-sm font-medium text-gray-700">
        Keyword
        <input className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2" name="what" placeholder="e.g. software engineer" required />
      </label>
      <label className="min-w-48 flex-1 text-sm font-medium text-gray-700">
        Location <span className="font-normal text-gray-500">(optional)</span>
        <input className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2" name="where" placeholder="e.g. London" />
      </label>
      <button className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
        {isPending ? 'Searching…' : 'Search jobs'}
      </button>
      {error && <p className="w-full text-sm text-red-700" role="alert">{error}</p>}
    </form>
  )
}
