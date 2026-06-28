'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getSession, saveSession, getOrCreateSessionId, type Session } from '@/lib/session'

interface Props {
  open: boolean
  onDeclared: (session: Session) => void
}

export default function DeclarationModal({ open, onDeclared }: Props) {
  const t = useTranslations('onboarding')
  const [isResident, setIsResident] = useState<'yes' | 'no' | null>(null)
  const [displayName, setDisplayName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isResident === null) return
    const session: Session = {
      sessionId: getOrCreateSessionId(),
      isResident: isResident === 'yes',
      displayName: displayName.trim(),
      declared: true,
    }
    saveSession(session)
    onDeclared(session)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('residentQuestion')}</Label>
            <RadioGroup value={isResident ?? ''} onValueChange={v => setIsResident(v as 'yes' | 'no')}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#2D6A4F] cursor-pointer transition-colors">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="cursor-pointer flex-1 font-normal">{t('yes')}</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#2D6A4F] cursor-pointer transition-colors">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="cursor-pointer flex-1 font-normal">{t('no')}</Label>
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
            disabled={isResident === null}
            className="w-full bg-[#2D6A4F] hover:bg-[#245a42] text-white"
          >
            {t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
