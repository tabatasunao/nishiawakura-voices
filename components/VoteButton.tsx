'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleVote } from '@/app/actions'
import { getSession, type Session } from '@/lib/session'
import DeclarationModal from './DeclarationModal'

interface Props {
  questionId: string
  initialVoteCount: number
  initialVoted: boolean
}

export default function VoteButton({ questionId, initialVoteCount, initialVoted }: Props) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialVoteCount)
  const [showModal, setShowModal] = useState(false)

  function doVote(session: Session) {
    const newVoted = !voted
    setVoted(newVoted)
    setCount(c => newVoted ? c + 1 : c - 1)

    startTransition(async () => {
      const result = await toggleVote(questionId, session.sessionId, session.isResident)
      if (result.error) {
        setVoted(voted)
        setCount(count)
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
        className={`gap-1.5 min-w-[80px] transition-all ${
          voted
            ? 'bg-[#2D6A4F] hover:bg-[#245a42] text-white border-[#2D6A4F]'
            : 'border-[#2D6A4F] text-[#2D6A4F] hover:bg-green-50'
        }`}
      >
        <span>{voted ? '✓' : '▲'}</span>
        <span>{count}</span>
      </Button>
      <DeclarationModal open={showModal} onDeclared={handleDeclared} />
    </>
  )
}
