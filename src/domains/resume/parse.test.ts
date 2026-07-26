import { describe, expect, it, vi } from 'vitest'
import { buildDocx } from './build-docx'
import { parseResume } from './parse'

const unpdf = vi.hoisted(() => ({ getDocumentProxy: vi.fn(), extractText: vi.fn() }))

vi.mock('unpdf', () => unpdf)

describe('parseResume', () => {
  it('extracts plain text from a DOCX buffer', async () => {
    const result = await parseResume(await buildDocx('Alex Doe\nProduct manager'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    expect(result).toEqual({ ok: true, text: 'Alex Doe\nProduct manager' })
  })

  it('extracts merged PDF text', async () => {
    unpdf.getDocumentProxy.mockResolvedValueOnce({})
    unpdf.extractText.mockResolvedValueOnce({ text: 'Alex Doe\nEngineer' })

    await expect(parseResume(Buffer.from('pdf'), 'application/pdf')).resolves.toEqual({ ok: true, text: 'Alex Doe\nEngineer' })
  })

  it('rejects empty extraction and unsupported files', async () => {
    unpdf.getDocumentProxy.mockResolvedValueOnce({})
    unpdf.extractText.mockResolvedValueOnce({ text: '   ' })

    await expect(parseResume(Buffer.from('pdf'), 'application/pdf')).resolves.toEqual({ ok: false, error: 'The résumé contains no extractable text.' })
    await expect(parseResume(Buffer.from('text'), 'text/plain')).resolves.toEqual({ ok: false, error: 'Only PDF and DOCX résumés are supported.' })
  })
})
