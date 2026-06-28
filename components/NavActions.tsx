'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NavActions({ user }: { user: User | null }) {
  const t = useTranslations('nav')
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (user) {
    return (
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sm">
        {t('logout')}
      </Button>
    )
  }

  return (
    <Button asChild size="sm" className="bg-[#2D6A4F] hover:bg-[#245a42] text-white text-sm">
      <Link href="/login">{t('login')}</Link>
    </Button>
  )
}
