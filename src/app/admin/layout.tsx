import { checkIsAdmin } from '@/lib/auth.server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The admin check is now being bypassed in the checkIsAdmin function itself
  await checkIsAdmin()

  return <>{children}</>
}
