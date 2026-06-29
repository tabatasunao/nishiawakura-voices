'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import ResidentBadge from './ResidentBadge'
import DeclarationModal from './DeclarationModal'
import { addComment, deleteComment, polishText } from '@/app/actions'
import { getSession, type Session } from '@/lib/session'
import type { Comment } from '@/lib/supabase/types'

interface Props {
  questionId: string
  initialComments: Comment[]
  isAdmin?: boolean
}

export default function CommentSection({ questionId, initialComments, isAdmin }: Props) {
  const t = useTranslations('question')
  const tErr = useTranslations('errors')
  const tP = useTranslations('polish')
  const locale = useLocale()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isPolishing, setIsPolishing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [mySession, setMySession] = useState<Session | null>(null)

  const dateLocale = locale === 'ja' ? ja : undefined
  const bodyLength = body.length
  const counterColour = bodyLength > 450 ? 'text-red-500' : bodyLength > 400 ? 'text-amber-500' : 'text-gray-500'

  useEffect(() => {
    setMySession(getSession())
  }, [])

  function doSubmit(session: Session) {
    if (!body.trim()) return
    const optimisticBody = body
    setBody('')
    startTransition(async () => {
      const result = await addComment(questionId, session.sessionId, optimisticBody, session.displayName, session.isResident)
      if (result.error === 'too_long') {
        toast.error(tErr('commentTooLong'))
        setBody(optimisticBody)
      } else if (result.error) {
        toast.error(tErr('generic'))
        setBody(optimisticBody)
      } else if (result.comment) {
        setComments(c => [...c, result.comment!])
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) { toast.error(tErr('commentEmpty')); return }
    const session = getSession()
    if (!session?.declared) {
      setPendingSubmit(true)
      setShowModal(true)
      return
    }
    doSubmit(session)
  }

  function handleDeclared(session: Session) {
    setShowModal(false)
    setMySession(session)
    if (pendingSubmit) {
      setPendingSubmit(false)
      doSubmit(session)
    }
  }

  async function handlePolish() {
    if (!body.trim()) return
    setIsPolishing(true)
    const result = await polishText(body, 'comment')
    setIsPolishing(false)
    if (result.polished) setBody(result.polished)
    else toast.error(tP('error'))
  }

  function handleDelete(commentId: string, sessionId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId, sessionId)
      if (result.error) toast.error(tErr('generic'))
      else setComments(c => c.filter(x => x.id !== commentId))
    })
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">{t('comments')} ({comments.length})</h2>

      <ul className="space-y-4 mb-6">
        {comments.map(comment => {
          const text = locale === 'en' && comment.body_en_cache ? comment.body_en_cache : comment.body
          const name = comment.display_name ?? t('anonymous')
          const isOwn = mySession?.sessionId === comment.session_id

          return (
            <li key={comment.id} className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold" aria-hidden="true">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-gray-900">{name}</span>
                  {comment.is_resident && <ResidentBadge />}
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: dateLocale })}
                  </span>
                  {(isOwn || isAdmin) && (
                    <button
                      onClick={() => handleDelete(comment.id, comment.session_id)}
                      aria-label={t('deleteCommentBy', { name })}
                      className="ml-auto p-2 -m-2 text-gray-500 hover:text-red-600 text-xs"
                    >
                      {t('delete')}
                    </button>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed">{text}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t('commentPlaceholder')}
          maxLength={500}
          rows={3}
          className="resize-none"
          autoCorrect="off"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPolishing || !body.trim()}
            onClick={handlePolish}
            className="min-h-[44px] text-xs shrink-0"
          >
            {isPolishing ? tP('polishing') : tP('button')}
          </Button>
          <span className={`text-xs flex-1 text-right ${counterColour}`}>{bodyLength}/500</span>
          <Button type="submit" disabled={isPending || isPolishing} size="sm" className="min-h-[44px] bg-forest hover:bg-forest-dark text-white shrink-0">
            {t('submitComment')}
          </Button>
        </div>
      </form>

      <DeclarationModal
        open={showModal}
        onDeclared={handleDeclared}
        onCancel={() => { setShowModal(false); setPendingSubmit(false) }}
      />
    </div>
  )
}
