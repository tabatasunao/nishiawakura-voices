import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AdminTable from '@/components/AdminTable'

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')

  const cookieStore = await cookies()
  const adminCookie = cookieStore.get('nv_admin')?.value
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
      <AdminTable questions={questions ?? []} />
    </div>
  )
}
