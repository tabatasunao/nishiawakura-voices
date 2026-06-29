'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleVote } from '@/app/actions'
import { getSession, type Session } from '@/lib/session'
import { isVoted, setVoted } from '@/lib/voteCache'
import DeclarationModal from './DeclarationModal'

interface Props {
  questionId: string
  initialVoteCount: number
}

export default function VoteButton({ questionId, initialVoteCount }: Props) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [voted, setVotedState] = useState(false)
  const [count, setCount] = useState(initialVoteCount)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setVotedState(isVoted(questionId))
  }, [questionId])

  function doVote(session: Session) {
    const prevVoted = voted
    const prevCount = count
    const newVoted = !prevVoted
    setVotedState(newVoted)
    setCount(c => newVoted ? c + 1 : c - 1)
    setVoted(questionId, newVoted)

    startTransition(async () => {
      const result = await toggleVote(questionId, session.sessionId, session.isResident)
      if (result.error) {
        setVotedState(prevVoted)
        setCount(prevCount)
        setVoted(questionId, prevVoted)
        toast.error(t('errors.generic'))
      }
    })
  }

  function handleClick() {
    const session = getSession()
    if (!session?.declared) {
      setShowModal(true)
      return
    }
    doVote(session)
  }

  function handleDeclared(session: Session) {
    setShowModal(false)
    doVote(session)
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant={voted ? 'default' : 'outline'}
        size="sm"
        className={`gap-1.5 min-w-[80px] min-h-[44px] transition-all active:scale-95 ${
          voted
            ? 'bg-forest hover:bg-forest-dark text-white border-forest'
            : 'border-forest text-forest hover:bg-green-50'
        }`}
      >
        {isPending ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <span>{voted ? '✓' : '▲'}</span>
        )}
        <span>{count}</span>
      </Button>
      <DeclarationModal
        open={showModal}
        onDeclared={handleDeclared}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}
