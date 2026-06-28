'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

function normalizePhone(raw: string): string {
  // Convert Japanese format 090-1234-5678 → +819012345678
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return '+81' + digits.slice(1)
  }
  if (!digits.startsWith('+')) return '+' + digits
  return raw
}

export default function LoginPage() {
  const t = useTranslations('login')
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const normalized = normalizePhone(phone)
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized })
    setIsLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('otpSent'))
      setStep('otp')
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const normalized = normalizePhone(phone)
    const { error } = await supabase.auth.verifyOtp({ phone: normalized, token: otp, type: 'sms' })
    setIsLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      // Check if profile exists and has been through onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('display_name, is_resident').eq('id', user.id).single()
        // If display_name is null, they haven't completed onboarding
        if (!profile?.display_name) {
          router.push('/onboarding')
        } else {
          router.push('/')
        }
      }
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('title')}</h1>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('phoneLabel')}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              inputMode="tel"
              required
            />
            <p className="text-xs text-gray-400">例: 090-1234-5678 または +81-90-1234-5678</p>
          </div>
          <Button type="submit" disabled={isLoading || !phone} className="w-full bg-[#2D6A4F] hover:bg-[#245a42] text-white">
            {isLoading ? '送信中…' : t('sendOtp')}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">{t('otpSent')}</p>
          <div className="space-y-1.5">
            <Label htmlFor="otp">{t('otpLabel')}</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('otpPlaceholder')}
              inputMode="numeric"
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />
          </div>
          <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-[#2D6A4F] hover:bg-[#245a42] text-white">
            {isLoading ? '確認中…' : t('verify')}
          </Button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-gray-400 hover:text-gray-600">
            {t('back')}
          </button>
        </form>
      )}
    </div>
  )
}
