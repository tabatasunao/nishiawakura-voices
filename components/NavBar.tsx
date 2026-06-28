import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LocaleSwitcher from './LocaleSwitcher'
import NavActions from './NavActions'

export default async function NavBar() {
  const t = useTranslations('nav')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    isAdmin = data?.is_admin ?? false
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-[#2D6A4F] text-sm leading-tight">
          西粟倉村<br className="hidden sm:block" />
          <span className="text-gray-500 font-normal text-xs">公開質問状</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/questions/propose" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-3 py-1">
            {t('propose')}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-3 py-1">
              {t('admin')}
            </Link>
          )}
          <LocaleSwitcher />
          <NavActions user={user} />
        </nav>
      </div>
    </header>
  )
}
