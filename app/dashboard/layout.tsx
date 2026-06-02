import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import NavBar from '@/components/NavBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar role={auth.role} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
