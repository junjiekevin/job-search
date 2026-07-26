import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_MIME = 'application/pdf'

export type ParseResult = { ok: true; text: string } | { ok: false; error: string }

function textResult(text: string): ParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim()
  return normalized ? { ok: true, text: normalized } : { ok: false, error: 'The résumé contains no extractable text.' }
}

export async function parseResume(buffer: Buffer, mime: string): Promise<ParseResult> {
  try {
    if (mime === DOCX_MIME) {
      const { value } = await mammoth.extractRawText({ buffer })
      return textResult(value)
    }

    if (mime === PDF_MIME) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      return textResult(text)
    }
  } catch {
    return { ok: false, error: 'Could not extract text from this résumé.' }
  }

  return { ok: false, error: 'Only PDF and DOCX résumés are supported.' }
}
