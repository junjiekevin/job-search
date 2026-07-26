'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { FeedbackGeneration } from '@/domains/analysis/types'

interface GeneratePanelProps {
  activeResume: { filename: string } | null
  jobId: string
  onGenerateResume: (jobId: string) => Promise<GenerateResumeResult>
  onGenerateCoverLetter: (jobId: string) => Promise<GenerateCoverLetterResult>
  onGenerateFeedback: (jobId: string) => Promise<GenerateFeedbackResult>
}

type GenerateResumeResult =
  | { ok: true; data: { docxBase64: string } }
  | { ok: false; error: string }

type GenerateCoverLetterResult =
  | { ok: true; data: { coverLetter: string } }
  | { ok: false; error: string }

type GenerateFeedbackResult =
  | { ok: true; data: FeedbackGeneration }
  | { ok: false; error: string }

function downloadDocx(base64: string): void {
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tailored-resume.docx'
  link.click()
  URL.revokeObjectURL(url)
}

function FeedbackList({ title, values }: { title: string; values: string[] }): React.JSX.Element | null {
  if (values.length === 0) return null

  return (
    <div>
      <h3 className="font-medium text-gray-950">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
        {values.map(value => <li key={value}>{value}</li>)}
      </ul>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: FeedbackGeneration }): React.JSX.Element {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Fit rating</p>
        <p className="mt-2 text-3xl font-semibold text-gray-950">{feedback.rating}/100</p>
        <p className="mt-2 text-sm leading-6 text-gray-700">{feedback.rationale}</p>
      </div>
      <FeedbackList title="Strengths" values={feedback.strengths} />
      <FeedbackList title="Gaps" values={feedback.gaps} />
      <FeedbackList title="Improvements" values={feedback.improvements} />
      <FeedbackList title="Suggestions" values={feedback.suggestions} />
    </div>
  )
}

function ActionButton(
  { disabled, isPending, label, pendingLabel, onClick }: { disabled: boolean; isPending: boolean; label: string; pendingLabel: string; onClick: () => void }
): React.JSX.Element {
  return (
    <button
      className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || isPending}
      onClick={onClick}
      type="button"
    >
      {isPending ? pendingLabel : label}
    </button>
  )
}

export function GeneratePanel({
  activeResume,
  jobId,
  onGenerateResume,
  onGenerateCoverLetter,
  onGenerateFeedback,
}: GeneratePanelProps): React.JSX.Element {
  const isDisabled = !activeResume
  const [isResumePending, startResumeTransition] = useTransition()
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [resumeDocx, setResumeDocx] = useState<string | null>(null)
  const [isCoverLetterPending, startCoverLetterTransition] = useTransition()
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [isFeedbackPending, startFeedbackTransition] = useTransition()
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackGeneration | null>(null)

  function handleResume(): void {
    startResumeTransition(async () => {
      setResumeError(null)
      const result = await onGenerateResume(jobId)
      if (!result.ok) {
        setResumeError(result.error)
        return
      }
      setResumeDocx(result.data.docxBase64)
    })
  }

  function handleCoverLetter(): void {
    startCoverLetterTransition(async () => {
      setCoverLetterError(null)
      const result = await onGenerateCoverLetter(jobId)
      if (!result.ok) {
        setCoverLetterError(result.error)
        return
      }
      setCoverLetter(result.data.coverLetter)
    })
  }

  function handleFeedback(): void {
    startFeedbackTransition(async () => {
      setFeedbackError(null)
      const result = await onGenerateFeedback(jobId)
      if (!result.ok) {
        setFeedbackError(result.error)
        return
      }
      setFeedback(result.data)
    })
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-xl font-semibold">Tailor application materials</h2>
      {activeResume ? (
        <p className="mt-2 text-sm text-gray-600">Active résumé: <span className="font-medium text-gray-950">{activeResume.filename}</span> · <Link className="text-blue-700 hover:underline" href="/resumes">Switch résumés</Link></p>
      ) : (
        <p className="mt-2 text-sm text-amber-700">Choose an active résumé in <Link className="underline" href="/resumes">My résumés</Link> before generating.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <ActionButton disabled={isDisabled} isPending={isResumePending} label="Generate résumé" onClick={handleResume} pendingLabel="Generating résumé…" />
        <ActionButton disabled={isDisabled} isPending={isCoverLetterPending} label="Generate cover letter" onClick={handleCoverLetter} pendingLabel="Generating cover letter…" />
        <ActionButton disabled={isDisabled} isPending={isFeedbackPending} label="Generate feedback + rating" onClick={handleFeedback} pendingLabel="Generating feedback…" />
      </div>
      {resumeError && <p className="mt-3 text-sm text-red-700" role="alert">{resumeError}</p>}
      {resumeDocx && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h2 className="text-lg font-semibold">Tailored résumé</h2>
          <button className="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50" onClick={() => downloadDocx(resumeDocx)} type="button">
            Download tailored résumé (.docx)
          </button>
        </div>
      )}
      {coverLetterError && <p className="mt-3 text-sm text-red-700" role="alert">{coverLetterError}</p>}
      {coverLetter && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h2 className="text-lg font-semibold">Cover letter</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{coverLetter}</p>
        </div>
      )}
      {feedbackError && <p className="mt-3 text-sm text-red-700" role="alert">{feedbackError}</p>}
      {feedback && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h2 className="text-lg font-semibold">Feedback + rating</h2>
          <FeedbackCard feedback={feedback} />
        </div>
      )}
    </section>
  )
}
