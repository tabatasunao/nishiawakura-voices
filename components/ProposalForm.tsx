'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { proposeQuestion } from '@/app/actions'
import { getSession, getOrCreateSessionId, type Session } from '@/lib/session'
import DeclarationModal from './DeclarationModal'

const CATEGORIES = ['財政','人口','産業','林業','農業','観光','教育','医療福祉','インフラ','脱炭素','その他']

export default function ProposalForm() {
  const t = useTranslations('propose')
  const ct = useTranslations('categories')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('その他')
  const [showModal, setShowModal] = useState(false)

  function doSubmit(sessionId: string) {
    startTransition(async () => {
      const result = await proposeQuestion(title.trim(), body.trim(), category, sessionId)
      if (result.error) toast.error('エラーが発生しました')
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
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} maxLength={100} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">{t('bodyLabel')}</Label>
          <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder={t('bodyPlaceholder')} maxLength={1000} rows={6} required className="resize-none" />
          <p className="text-xs text-gray-400 text-right">{body.length}/1000</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">{t('categoryLabel')}</Label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
            {CATEGORIES.map(c => <option key={c} value={c}>{ct(c as Parameters<typeof ct>[0])}</option>)}
          </select>
        </div>

        <Button type="submit" disabled={isPending || !title.trim() || !body.trim()} className="w-full bg-[#2D6A4F] hover:bg-[#245a42] text-white">
          {isPending ? '送信中…' : t('submit')}
        </Button>
      </form>
      <DeclarationModal open={showModal} onDeclared={handleDeclared} />
    </>
  )
}
