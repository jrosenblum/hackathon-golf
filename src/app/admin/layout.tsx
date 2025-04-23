import { checkIsAdmin } from '@/lib/auth.server'

// Tell Next.js this layout is dynamic and can't be statically generated
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The admin check is now being bypassed in the checkIsAdmin function itself
  await checkIsAdmin()

  return <>{children}</>
}
