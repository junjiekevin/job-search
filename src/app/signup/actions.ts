'use server'

import { createClient } from '@/lib/db/server'

type SignupResult = { ok: true; data: { email: string } } | { ok: false; error: string }

export async function signup(_prev: unknown, formData: FormData): Promise<SignupResult> {
  const emailEntry = formData.get('email')
  const passwordEntry = formData.get('password')
  const email = typeof emailEntry === 'string' ? emailEntry : null
  const password = typeof passwordEntry === 'string' ? passwordEntry : null

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: { email: data.user?.email ?? email } }
}
