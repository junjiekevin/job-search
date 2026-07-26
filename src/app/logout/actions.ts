'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/db/server'

export async function logout(): Promise<never> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('Unable to sign out. Please try again.')
  }

  redirect('/login')
}
