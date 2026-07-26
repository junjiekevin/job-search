'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { Analysis } from '@/domains/analysis/types'

interface GeneratePanelProps {
  activeResume: { filename: string } | null
  jobId: string
  onGenerate: (jobId: string) => Promise<GenerateResult>
}

interface GenerationOutput {
  analysis: Analysis
  coverLetter: string
  docxBase64: string
}

type GenerateResult =
  | { ok: true; data: GenerationOutput }
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

function AnalysisList({ title, values }: { title: string; values: string[] }): React.JSX.Element | null {
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

function AnalysisAdvice({ analysis }: { analysis: Analysis }): React.JSX.Element {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <AnalysisList title="Strong alignment" values={analysis.strongAlignment} />
      <AnalysisList title="Gaps to address" values={analysis.missingQualifications} />
      <AnalysisList title="Résumé improvements" values={analysis.resumeImprovements} />
      <AnalysisList title="Required skills" values={analysis.requiredSkills} />
    </div>
  )
}

export function GeneratePanel({ activeResume, jobId, onGenerate }: GeneratePanelProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<GenerationOutput | null>(null)

  function handleGenerate(): void {
    startTransition(async () => {
      setError(null)
      const result = await onGenerate(jobId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOutput(result.data)
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
      <button
        className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !activeResume}
        onClick={handleGenerate}
        type="button"
      >
        {isPending ? 'Generating…' : 'Generate materials'}
      </button>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      {output && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h2 className="text-lg font-semibold">Job analysis</h2>
          <AnalysisAdvice analysis={output.analysis} />
          <h2 className="mt-6 text-lg font-semibold">Cover letter</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{output.coverLetter}</p>
          <button className="mt-5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50" onClick={() => downloadDocx(output.docxBase64)} type="button">
            Download tailored résumé (.docx)
          </button>
        </div>
      )}
    </section>
  )
}
