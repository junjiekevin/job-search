import { createClient } from '@/lib/db/server'
import type { Tables } from '@/lib/db/types'
import type { Resume } from './types'

const BUCKET = 'resumes'

type ResumeRow = Tables<'resumes'>

function toResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    storagePath: row.storage_path,
    filename: row.filename,
    mimeType: row.mime_type,
    extractedText: row.extracted_text,
    isSelected: row.is_selected,
    uploadedAt: row.uploaded_at,
  }
}

export async function listResumes(): Promise<Resume[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('resumes').select().order('uploaded_at', { ascending: false })
  if (error) throw error
  return data.map(toResume)
}

export async function getSelectedResume(): Promise<Resume | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('resumes').select().eq('is_selected', true).maybeSingle()
  if (error) throw error
  return data ? toResume(data) : null
}

export async function uploadResume(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  extractedText: string,
): Promise<Resume> {
  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
  if (countError) throw countError
  if (count !== null && count >= 3) {
    throw new Error('Maximum of 3 résumés allowed')
  }

  const id = crypto.randomUUID()
  const storagePath = `${id}/${filename}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false })
  if (uploadError) throw uploadError

  const { data, error: insertError } = await supabase
    .from('resumes')
    .insert({
      storage_path: storagePath,
      filename,
      mime_type: mimeType,
      extracted_text: extractedText,
    })
    .select()
    .single()
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    throw insertError
  }

  return toResume(data)
}

export async function setSelectedResume(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_selected_resume', { p_id: id })
  if (error) throw error
}

export async function deleteResume(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: row, error: getError } = await supabase
    .from('resumes')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle()
  if (getError) throw getError
  if (!row) return

  const { error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path])
  if (removeError) throw removeError

  const { error: deleteError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
  if (deleteError) throw deleteError
}
