'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ResidentBadge from './ResidentBadge'
import { addComment, deleteComment } from '@/app/actions'
import type { Comment, Profile } from '@/lib/supabase/types'

interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, 'display_name' | 'is_resident'> | null
}

interface Props {
  questionId: string
  initialComments: CommentWithProfile[]
  isLoggedIn: boolean
  currentUserId?: string
  isAdmin: boolean
}

export default function CommentSection({ questionId, initialComments, isLoggedIn, currentUserId, isAdmin }: Props) {
  const t = useTranslations('question')
  const tErr = useTranslations('errors')
  const locale = useLocale()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const dateLocale = locale === 'ja' ? ja : undefined

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) {
      toast.error(tErr('commentEmpty'))
      return
    }

    startTransition(async () => {
      const result = await addComment(questionId, body)
      if (result.error) {
        toast.error(tErr('generic'))
      } else {
        setBody('')
        toast.success('コメントを投稿しました')
      }
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId)
      if (result.error) {
        toast.error(tErr('generic'))
      } else {
        setComments(c => c.filter(x => x.id !== commentId))
      }
    })
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">{t('comments')} ({comments.length})</h2>

      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={t('commentPlaceholder')}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <Button type="submit" disabled={isPending} size="sm" className="self-end bg-[#2D6A4F] hover:bg-[#245a42] text-white">
            {t('submitComment')}
          </Button>
        </form>
      )}

      <ul className="space-y-4">
        {comments.map(comment => {
          const text = locale === 'en' && comment.body_en_cache ? comment.body_en_cache : comment.body
          const name = comment.profiles?.display_name ?? '匿名'
          const isResident = comment.profiles?.is_resident ?? false
          const canDelete = isAdmin || comment.user_id === currentUserId

          return (
            <li key={comment.id} className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{name}</span>
                  {isResident && <ResidentBadge />}
                  <span className="text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: dateLocale })}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                    >
                      削除
                    </button>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {text ?? <Skeleton className="h-4 w-48" />}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
