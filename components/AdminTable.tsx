'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Question } from '@/lib/supabase/types'
import { updateQuestionStatus } from '@/app/actions'

interface Props {
  questions: Question[]
}

export default function AdminTable({ questions: initialQuestions }: Props) {
  const t = useTranslations('admin')
  const [questions, setQuestions] = useState(initialQuestions)
  const [isPending, startTransition] = useTransition()

  function handleStatus(id: string, status: Question['status']) {
    startTransition(async () => {
      const result = await updateQuestionStatus(id, status)
      if (result.error) {
        toast.error('エラーが発生しました')
      } else {
        setQuestions(qs => qs.map(q => q.id === id ? { ...q, status } : q))
      }
    })
  }

  function exportMarkdown() {
    const selected = questions.filter(q => q.status === 'selected')
    const md = `# 西粟倉村 選挙公開質問状\n\n${selected.map((q, i) =>
      `## Q${i + 1}. ${q.title}\n\n${q.body}\n\n*${q.vote_count}票（うち村民${q.resident_vote_count}人）*\n`
    ).join('\n---\n\n')}`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nishiawakura-koukaiShitsumonjo.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedCount = questions.filter(q => q.status === 'selected').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">選定済み: {selectedCount}/10</p>
        <Button onClick={exportMarkdown} disabled={selectedCount === 0} size="sm" variant="outline">
          {t('export')}
        </Button>
      </div>

      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <span className="text-lg font-bold text-gray-300 w-7 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 line-clamp-1">{q.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {q.vote_count}票 &nbsp;|&nbsp; 村民{q.resident_vote_count}票 &nbsp;|&nbsp; {q.category}
              </p>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
              <Badge
                variant="outline"
                className={`text-xs ${
                  q.status === 'selected' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  q.status === 'proposed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-gray-100 text-gray-600'
                }`}
              >
                {q.status}
              </Badge>
              {q.status === 'selected' ? (
                <Button
                  size="sm" variant="outline" disabled={isPending}
                  onClick={() => handleStatus(q.id, 'active')}
                  className="text-xs h-7"
                >
                  {t('deselectTop10')}
                </Button>
              ) : q.status !== 'archived' ? (
                <>
                  <Button
                    size="sm" disabled={isPending || selectedCount >= 10}
                    onClick={() => handleStatus(q.id, 'selected')}
                    className="text-xs h-7 bg-[#2D6A4F] hover:bg-[#245a42] text-white"
                  >
                    {t('selectTop10')}
                  </Button>
                  <Button
                    size="sm" variant="ghost" disabled={isPending}
                    onClick={() => handleStatus(q.id, 'archived')}
                    className="text-xs h-7 text-red-500 hover:text-red-700"
                  >
                    {t('archive')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm" variant="outline" disabled={isPending}
                  onClick={() => handleStatus(q.id, 'active')}
                  className="text-xs h-7"
                >
                  復元
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
