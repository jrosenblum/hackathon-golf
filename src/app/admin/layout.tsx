import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function checkIsAdmin() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }
  
  return true
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkIsAdmin()

  return <>{children}</>
}
