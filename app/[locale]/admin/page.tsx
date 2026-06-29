import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AdminTable from '@/components/AdminTable'

function safeTokenEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')

  if (!process.env.ADMIN_TOKEN) redirect('/')
  const cookieStore = await cookies()
  if (!safeTokenEqual(cookieStore.get('nv_admin')?.value, process.env.ADMIN_TOKEN)) redirect('/')

  const supabase = await createClient()
  const { data: questions } = await supabase
    .from('questions')
    .select('id, number, title, body, vote_count, resident_vote_count, category, status, proposed_by_session, created_at, title_en_cache, body_en_cache')
    .order('vote_count', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('title')}</h1>
      <AdminTable questions={questions ?? []} />
    </div>
  )
}
