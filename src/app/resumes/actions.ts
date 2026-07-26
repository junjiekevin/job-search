'use server'

import { parseResume } from '@/domains/resume/parse'
import { uploadResume, setSelectedResume, deleteResume } from '@/domains/resume/db'
import { revalidatePath } from 'next/cache'

const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export async function uploadResumeAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No file provided' }
  }

  const mimeType = file.type
  if (!ALLOWED_MIME.includes(mimeType as typeof ALLOWED_MIME[number])) {
    return { ok: false, error: 'Only PDF and DOCX files are supported' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseResume(buffer, mimeType)
    if (!parsed.ok) return { ok: false, error: parsed.error }

    await uploadResume(buffer, file.name, mimeType, parsed.text)
    revalidatePath('/resumes')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Upload failed' }
  }
}

export async function setSelectedAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { ok: false, error: 'Missing résumé ID' }
  }

  try {
    await setSelectedResume(id)
    revalidatePath('/resumes')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Selection failed' }
  }
}

export async function deleteResumeAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { ok: false, error: 'Missing résumé ID' }
  }

  try {
    await deleteResume(id)
    revalidatePath('/resumes')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Delete failed' }
  }
}
