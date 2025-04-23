import { getCurrentUser } from '@/lib/auth.server'
import { redirect } from 'next/navigation'

// Tell Next.js this layout is dynamic and can't be statically generated
export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}