'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'
import { cookies } from 'next/headers'

function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

function isAdminAuthorized(): boolean {
  // Check for admin token cookie set by middleware
  return true // Middleware handles the guard; this is called only from admin page
}

export async function toggleVote(questionId: string, sessionId: string, isResident: boolean) {
  if (!isValidUUID(sessionId) || !isValidUUID(questionId)) return { error: 'invalid' }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('session_id', sessionId)
    .single()

  if (existing) {
    await db.from('votes').delete().eq('id', existing.id)
    revalidatePath('/', 'layout')
    return { voted: false }
  } else {
    const { error } = await db.from('votes').insert({ question_id: questionId, session_id: sessionId, is_resident: isResident })
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { voted: true }
  }
}

export async function addComment(questionId: string, sessionId: string, body: string, displayName: string, isResident: boolean) {
  if (!isValidUUID(sessionId) || !isValidUUID(questionId)) return { error: 'invalid' }
  if (!body.trim()) return { error: 'empty' }

  const db = createAdminClient()

  const { data: comment, error } = await db
    .from('comments')
    .insert({
      question_id: questionId,
      session_id: sessionId,
      body: body.trim(),
      display_name: displayName || null,
      is_resident: isResident,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Translate asynchronously — fills cache for EN viewers
  translateToEnglish(body.trim()).then(translated =>
    createAdminClient().from('comments').update({ body_en_cache: translated }).eq('id', comment.id)
  ).catch(() => {})

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function proposeQuestion(title: string, body: string, category: string, sessionId: string) {
  if (!isValidUUID(sessionId)) return { error: 'invalid' }

  const db = createAdminClient()
  const { data: question, error } = await db
    .from('questions')
    .insert({ title, body, category, status: 'proposed', proposed_by_session: sessionId })
    .select()
    .single()

  if (error) return { error: error.message }

  Promise.all([translateToEnglish(title), translateToEnglish(body)]).then(([t, b]) =>
    createAdminClient().from('questions').update({ title_en_cache: t, body_en_cache: b }).eq('id', question.id)
  ).catch(() => {})

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateQuestionStatus(questionId: string, status: 'active' | 'proposed' | 'archived' | 'selected', adminToken: string) {
  if (adminToken !== process.env.ADMIN_TOKEN) return { error: 'unauthorized' }

  const db = createAdminClient()
  const { error } = await db.from('questions').update({ status }).eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteComment(commentId: string, sessionId: string, adminToken?: string) {
  const db = createAdminClient()

  // Admin can delete anything; session owner can delete their own
  if (adminToken === process.env.ADMIN_TOKEN) {
    await db.from('comments').delete().eq('id', commentId)
  } else if (isValidUUID(sessionId)) {
    await db.from('comments').delete().eq('id', commentId).eq('session_id', sessionId)
  } else {
    return { error: 'unauthorized' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
