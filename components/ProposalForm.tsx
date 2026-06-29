'use client'

import { useState, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { proposeQuestion } from '@/app/actions'
import { SUGGESTED_TAGS, MAX_TAGS, MAX_TAG_LENGTH, isSuggestedTag } from '@/lib/tags'
import { getSession, type Session } from '@/lib/session'
import DeclarationModal from './DeclarationModal'

export default function ProposalForm() {
  const t = useTranslations('propose')
  const tt = useTranslations('tags')
  const tErr = useTranslations('errors')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const customRef = useRef<HTMLInputElement>(null)

  function toggleSuggested(tag: string) {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < MAX_TAGS ? [...prev, tag] : prev
    )
  }

  function addCustomTag() {
    const trimmed = customInput.trim()
    if (!trimmed || trimmed.length > MAX_TAG_LENGTH) return
    if (tags.includes(trimmed) || tags.length >= MAX_TAGS) return
    setTags(prev => [...prev, trimmed])
    setCustomInput('')
    customRef.current?.focus()
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function doSubmit(sessionId: string) {
    startTransition(async () => {
      const result = await proposeQuestion(title.trim(), body.trim(), tags, sessionId)
      if (result.error) toast.error(tErr('generic'))
      else { toast.success(t('success')); router.push('/') }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || tags.length === 0) return
    const session = getSession()
    if (!session?.declared) { setShowModal(true); return }
    doSubmit(session.sessionId)
  }

  function handleDeclared(session: Session) {
    setShowModal(false)
    doSubmit(session.sessionId)
  }

  const atMax = tags.length >= MAX_TAGS

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

        <div className="space-y-2">
          <Label>{tt('label')}</Label>
          <p className="text-xs text-gray-500">{tt('hint', { max: MAX_TAGS, maxLen: MAX_TAG_LENGTH })}</p>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={tt('removeTag', { tag })}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-forest text-white min-h-[28px]"
                >
                  {isSuggestedTag(tag) ? tt(tag as Parameters<typeof tt>[0]) : tag}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          )}

          {/* Predefined chips */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map(tag => {
              const selected = tags.includes(tag)
              const disabled = !selected && atMax
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSuggested(tag)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border min-h-[28px] transition-colors ${
                    selected
                      ? 'bg-forest/10 border-forest text-forest'
                      : disabled
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-600 hover:border-forest hover:text-forest'
                  }`}
                >
                  {tt(tag as Parameters<typeof tt>[0])}
                </button>
              )
            })}
          </div>

          {/* Custom tag input */}
          <div className="flex gap-2">
            <Input
              ref={customRef}
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
              placeholder={tt('placeholder')}
              maxLength={MAX_TAG_LENGTH}
              disabled={atMax}
              autoCorrect="off"
              autoCapitalize="none"
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomTag}
              disabled={atMax || !customInput.trim()}
              className="shrink-0"
            >
              {tt('addButton')}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending || !title.trim() || !body.trim() || tags.length === 0}
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
