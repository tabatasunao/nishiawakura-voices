import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LocaleSwitcher from './LocaleSwitcher'

export default function NavBar() {
  const t = useTranslations('nav')
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-[#2D6A4F] leading-tight">
          西粟倉村
          <span className="text-gray-500 font-normal text-xs ml-1.5">公開質問状</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/questions/propose" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-3 py-1">
            {t('propose')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  )
}
