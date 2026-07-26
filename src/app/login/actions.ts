'use server'

import { createClient } from '@/lib/db/server'

type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(_prev: unknown, formData: FormData): Promise<LoginResult> {
  const emailEntry = formData.get('email')
  const passwordEntry = formData.get('password')
  const email = typeof emailEntry === 'string' ? emailEntry : null
  const password = typeof passwordEntry === 'string' ? passwordEntry : null

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
