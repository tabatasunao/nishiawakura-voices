import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Toaster } from '@/components/ui/sonner'
import NavBar from '@/components/NavBar'
import '../globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '西粟倉村 選挙公開質問状 | Nishiawakura Election Questions',
  description: '村の未来を決める10の問いに投票してください。',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'ja' | 'en')) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale} className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-[family-name:var(--font-noto-sans-jp)]">
        <NextIntlClientProvider messages={messages}>
          <NavBar />
          <main className="flex-1 container mx-auto max-w-3xl px-4 py-8">
            {children}
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
