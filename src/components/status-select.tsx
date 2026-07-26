'use client'

import { useState, useTransition } from 'react'
import { APPLICATION_STATUSES, type Application, type ApplicationInput, type SaveApplicationResult } from '@/domains/applications/types'

interface StatusSelectProps {
  application: Application | null
  jobId: string
  onSave: (input: ApplicationInput) => Promise<SaveApplicationResult>
}

function labelFor(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

export function StatusSelect({ application, jobId, onSave }: StatusSelectProps): React.JSX.Element {
  const [status, setStatus] = useState(application?.status ?? 'saved')
  const [notes, setNotes] = useState(application?.notes ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(): void {
    startTransition(async () => {
      const result = await onSave({ jobId, status, notes })
      setMessage(result.ok ? 'Saved.' : result.error)
    })
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-xl font-semibold">Application tracking</h2>
      <form action={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Status
          <select className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" onChange={event => setStatus(event.target.value as ApplicationInput['status'])} value={status}>
            {APPLICATION_STATUSES.map(value => <option key={value} value={value}>{labelFor(value)}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Notes
          <textarea className="mt-1 block min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" onChange={event => setNotes(event.target.value)} placeholder="Add follow-up notes, contacts, or next steps." value={notes} />
        </label>
        <div className="flex items-center gap-3">
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
            {isPending ? 'Saving…' : 'Save tracking'}
          </button>
          {message && <p className="text-sm text-gray-600" role="status">{message}</p>}
        </div>
      </form>
    </section>
  )
}
