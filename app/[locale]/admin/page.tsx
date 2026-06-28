import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import AdminTable from '@/components/AdminTable'

export default async function AdminPage() {
  const t = useTranslations('admin')
  const cookieStore = await cookies()
  const adminCookie = cookieStore.get('nv_admin')?.value

  // Middleware already guards this route; double-check here
  if (adminCookie !== process.env.ADMIN_TOKEN) redirect('/')

  const supabase = await createClient()
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .neq('status', 'archived')
    .order('vote_count', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('title')}</h1>
      <AdminTable questions={questions ?? []} adminToken={process.env.ADMIN_TOKEN!} />
    </div>
  )
}
