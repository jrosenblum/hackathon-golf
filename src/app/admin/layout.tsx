import { checkIsAdmin } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkIsAdmin()

  return <>{children}</>
}
