import Link from 'next/link'

type AppTab = {
  href: '/' | '/resumes'
  label: string
  key: 'jobs' | 'add-job' | 'resumes'
}

const APP_TABS: AppTab[] = [
  { href: '/', key: 'jobs', label: 'Jobs' },
  { href: '/', key: 'add-job', label: 'Add job' },
  { href: '/resumes', key: 'resumes', label: 'Resumes' },
]

interface AppTabsProps {
  activeTab: AppTab['key']
  onLogout: () => Promise<never>
}

export function AppTabs({ activeTab, onLogout }: AppTabsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="App navigation" className="-mx-2 overflow-x-auto px-2">
        <ul className="flex min-w-max gap-2">
          {APP_TABS.map(tab => {
            const isActive = tab.key === activeTab
            const href = tab.key === 'add-job' ? '/#paste-job' : tab.href

            return (
              <li key={tab.key}>
                <Link
                  className={[
                    'block rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900',
                  ].join(' ')}
                  href={href}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <form action={onLogout}>
        <button
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
