import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'

export default async function Home() {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')
  if (auth.role === 'manager') redirect('/dashboard/manage')
  redirect('/dashboard')
}
