import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import AdminTable from '@/components/AdminTable'

export default async function AdminPage() {
  const t = useTranslations('admin')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

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
