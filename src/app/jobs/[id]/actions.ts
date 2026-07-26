'use server'

import { saveApplication } from '@/domains/applications/db'
import { isApplicationStatus, type ApplicationInput, type SaveApplicationResult } from '@/domains/applications/types'

function isApplicationInput(input: unknown): input is ApplicationInput {
  if (typeof input !== 'object' || input === null) return false

  const fields = input as { jobId?: unknown; status?: unknown; notes?: unknown }
  return typeof fields.jobId === 'string'
    && typeof fields.notes === 'string'
    && typeof fields.status === 'string'
    && isApplicationStatus(fields.status)
}

export async function saveJobApplication(input: unknown): Promise<SaveApplicationResult> {
  try {
    if (!isApplicationInput(input)) {
      return { ok: false, error: 'Enter a valid application status and notes.' }
    }

    const application = await saveApplication(input)
    return { ok: true, data: application }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Application update failed')
    return { ok: false, error: 'Could not save application tracking.' }
  }
}
