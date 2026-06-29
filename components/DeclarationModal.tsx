'use client'

import { useState, useId } from 'react'
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
  onCancel?: () => void
}

export default function DeclarationModal({ open, onDeclared, onCancel }: Props) {
  const t = useTranslations('onboarding')
  const uid = useId()
  const yesId = `${uid}-yes`
  const noId = `${uid}-no`
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

  function handleCancel() {
    setIsResident(null)
    setDisplayName('')
    onCancel?.()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleCancel() }}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('residentQuestion')}</Label>
            <RadioGroup value={isResident ?? ''} onValueChange={v => setIsResident(v as 'yes' | 'no')}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-forest cursor-pointer transition-colors">
                <RadioGroupItem value="yes" id={yesId} />
                <Label htmlFor={yesId} className="cursor-pointer flex-1 font-normal">{t('yes')}</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-forest cursor-pointer transition-colors">
                <RadioGroupItem value="no" id={noId} />
                <Label htmlFor={noId} className="cursor-pointer flex-1 font-normal">{t('no')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-name`}>{t('nameLabel')}</Label>
            <Input
              id={`${uid}-name`}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={30}
              autoComplete="nickname"
              autoCorrect="off"
            />
          </div>

          <Button
            type="submit"
            disabled={isResident === null}
            className="w-full min-h-[44px] bg-forest hover:bg-forest-dark text-white"
            title={isResident === null ? t('residentQuestion') : undefined}
          >
            {t('submit')}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={handleCancel} className="w-full min-h-[44px]">
              {t('cancel')}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
