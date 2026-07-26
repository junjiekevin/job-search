export const MAX_RESUMES = 3

export interface Resume {
  id: string
  storagePath: string
  filename: string
  mimeType: string
  extractedText: string | null
  isSelected: boolean
  uploadedAt: string
}
