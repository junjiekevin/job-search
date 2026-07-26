import type { ApplicationStatus as DbApplicationStatus } from '@/lib/db/types'

export type ApplicationStatus = DbApplicationStatus

export const APPLICATION_STATUSES = ['saved', 'applying', 'applied', 'interview', 'offer', 'rejected', 'archived'] as const satisfies readonly ApplicationStatus[]

export interface Application {
  jobId: string
  status: ApplicationStatus
  notes: string
  updatedAt: string
}

export interface ApplicationInput {
  jobId: string
  status: ApplicationStatus
  notes: string
}

export type SaveApplicationResult = { ok: true; data: Application } | { ok: false; error: string }

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus)
}
