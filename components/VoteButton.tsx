'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleVote } from '@/app/actions'

interface Props {
  questionId: string
  initialVoteCount: number
  initialVoted: boolean
  isLoggedIn: boolean
}

export default function VoteButton({ questionId, initialVoteCount, initialVoted, isLoggedIn }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialVoteCount)

  function handleVote() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Optimistic update
    const newVoted = !voted
    setVoted(newVoted)
    setCount(c => newVoted ? c + 1 : c - 1)

    startTransition(async () => {
      const result = await toggleVote(questionId)
      if (result.error) {
        // Roll back
        setVoted(voted)
        setCount(count)
        toast.error(t('errors.generic'))
      }
    })
  }

  return (
    <Button
      onClick={handleVote}
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
  )
}
