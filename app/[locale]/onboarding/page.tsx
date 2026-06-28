'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateProfile } from '@/app/actions'

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [isResident, setIsResident] = useState<'yes' | 'no' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isResident === null) return

    setIsLoading(true)
    const result = await updateProfile(displayName, isResident === 'yes')
    setIsLoading(false)

    if (result.error) {
      toast.error('エラーが発生しました')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-8">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">{t('residentQuestion')}</Label>
          <RadioGroup value={isResident ?? ''} onValueChange={v => setIsResident(v as 'yes' | 'no')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#2D6A4F] cursor-pointer">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer flex-1">{t('yes')}</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#2D6A4F] cursor-pointer">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="cursor-pointer flex-1">{t('no')}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">{t('nameLabel')}</Label>
          <Input
            id="name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={30}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || isResident === null}
          className="w-full bg-[#2D6A4F] hover:bg-[#245a42] text-white"
        >
          {isLoading ? '処理中…' : t('submit')}
        </Button>
      </form>
    </div>
  )
}
