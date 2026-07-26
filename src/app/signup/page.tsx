'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from './actions'

export default function SignupPage(): React.JSX.Element {
  const router = useRouter()
  const [state, formAction] = useActionState(signup, null)

  useEffect(() => {
    if (state?.ok) router.push('/')
  }, [state, router])

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <form action={formAction} className="space-y-4">
        {state && !state.ok && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-green-600">Check your email to confirm.</p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-gray-900 underline">Sign in</Link>
      </p>
    </main>
  )
}
