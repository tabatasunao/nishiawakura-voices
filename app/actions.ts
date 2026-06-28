'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'

export async function toggleVote(questionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'login_required' }

  // Check existing vote
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('votes').delete().eq('id', existing.id)
  } else {
    const { error } = await supabase.from('votes').insert({ question_id: questionId, user_id: user.id })
    if (error) return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { voted: !existing }
}

export async function addComment(questionId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'login_required' }
  if (!body.trim()) return { error: 'empty' }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ question_id: questionId, user_id: user.id, body: body.trim() })
    .select()
    .single()

  if (error) return { error: error.message }

  // Translate asynchronously (fire and forget — cache will fill on next EN page view)
  translateToEnglish(body.trim()).then(translated => {
    createClient().then(c =>
      c.from('comments').update({ body_en_cache: translated }).eq('id', comment.id)
    )
  }).catch(() => {})

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function proposeQuestion(title: string, body: string, category: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'login_required' }

  const { data: question, error } = await supabase
    .from('questions')
    .insert({ title, body, category, status: 'proposed', proposed_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  // Translate async
  Promise.all([
    translateToEnglish(title),
    translateToEnglish(body),
  ]).then(([titleEn, bodyEn]) => {
    createClient().then(c =>
      c.from('questions').update({ title_en_cache: titleEn, body_en_cache: bodyEn }).eq('id', question.id)
    )
  }).catch(() => {})

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateQuestionStatus(questionId: string, status: 'active' | 'proposed' | 'archived' | 'selected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('questions').update({ status }).eq('id', questionId)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateProfile(displayName: string, isResident: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName || null, is_resident: isResident })

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
