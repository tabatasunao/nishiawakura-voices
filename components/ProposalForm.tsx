'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { proposeQuestion } from '@/app/actions'
import { VALID_CATEGORIES } from '@/lib/categories'
import { getSession, type Session } from '@/lib/session'
import DeclarationModal from './DeclarationModal'

export default function ProposalForm() {
  const t = useTranslations('propose')
  const ct = useTranslations('categories')
  const tErr = useTranslations('errors')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('その他')
  const [showModal, setShowModal] = useState(false)

  function doSubmit(sessionId: string) {
    startTransition(async () => {
      const result = await proposeQuestion(title.trim(), body.trim(), category, sessionId)
      if (result.error) toast.error(tErr('generic'))
      else { toast.success(t('success')); router.push('/') }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    const session = getSession()
    if (!session?.declared) { setShowModal(true); return }
    doSubmit(session.sessionId)
  }

  function handleDeclared(session: Session) {
    setShowModal(false)
    doSubmit(session.sessionId)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t('titleLabel')}</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={100}
            required
            autoCorrect="off"
            autoCapitalize="none"
          />
          <p className={`text-xs text-right ${title.length > 90 ? 'text-red-500' : title.length > 80 ? 'text-amber-500' : 'text-gray-500'}`}>{title.length}/100</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">{t('bodyLabel')}</Label>
          <Textarea
            id="body"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={t('bodyPlaceholder')}
            maxLength={1000}
            rows={6}
            required
            className="resize-none"
            autoCorrect="off"
          />
          <p className={`text-xs text-right ${body.length > 950 ? 'text-red-500' : body.length > 900 ? 'text-amber-500' : 'text-gray-500'}`}>{body.length}/1000</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">{t('categoryLabel')}</Label>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
          >
            {VALID_CATEGORIES.map(c => <option key={c} value={c}>{ct(c as Parameters<typeof ct>[0])}</option>)}
          </select>
        </div>

        <Button
          type="submit"
          disabled={isPending || !title.trim() || !body.trim()}
          className="w-full min-h-[44px] bg-forest hover:bg-forest-dark text-white"
        >
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </form>
      <DeclarationModal
        open={showModal}
        onDeclared={handleDeclared}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}
