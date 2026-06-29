'use server'

import { timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'
import { isValidTagList } from '@/lib/tags'

function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

function safeTokenEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_TOKEN) return false
  const cookieStore = await cookies()
  return safeTokenEqual(cookieStore.get('nv_admin')?.value, process.env.ADMIN_TOKEN)
}

export async function toggleVote(questionId: string, sessionId: string, isResident: boolean) {
  if (!isValidUUID(sessionId) || !isValidUUID(questionId)) return { error: 'invalid' }

  const db = createAdminClient()

  const { data: existing, error: fetchError } = await db
    .from('votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('session_id', sessionId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') return { error: fetchError.message }

  if (existing) {
    const { error } = await db.from('votes').delete().eq('id', existing.id)
    if (error) return { error: error.message }
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
  if (body.trim().length > 500) return { error: 'too_long' }

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

  if (process.env.OPENAI_API_KEY) {
    after(async () => {
      try {
        const translated = await translateToEnglish(body.trim())
        await createAdminClient().from('comments').update({ body_en_cache: translated }).eq('id', comment.id)
      } catch {}
    })
  }

  revalidatePath('/', 'layout')
  return { success: true, comment }
}

export async function proposeQuestion(title: string, body: string, tags: string[], sessionId: string) {
  if (!isValidUUID(sessionId)) return { error: 'invalid' }
  if (!title.trim() || title.trim().length > 100) return { error: 'invalid' }
  if (!body.trim() || body.length > 1000) return { error: 'invalid' }
  if (!isValidTagList(tags)) return { error: 'invalid' }

  const db = createAdminClient()
  const { data: question, error } = await db
    .from('questions')
    .insert({ title: title.trim(), body: body.trim(), tags, status: 'proposed', proposed_by_session: sessionId })
    .select()
    .single()

  if (error) return { error: error.message }

  if (process.env.OPENAI_API_KEY) {
    after(async () => {
      try {
        const [titleEn, bodyEn] = await Promise.all([translateToEnglish(title), translateToEnglish(body)])
        await createAdminClient().from('questions').update({ title_en_cache: titleEn, body_en_cache: bodyEn }).eq('id', question.id)
      } catch {}
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateQuestionStatus(questionId: string, status: 'active' | 'proposed' | 'archived' | 'selected') {
  if (!isValidUUID(questionId)) return { error: 'invalid' }
  if (!await isAdmin()) return { error: 'unauthorized' }

  const db = createAdminClient()
  const { error } = await db.from('questions').update({ status }).eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteComment(commentId: string, sessionId: string) {
  const db = createAdminClient()

  if (await isAdmin()) {
    const { error } = await db.from('comments').delete().eq('id', commentId)
    if (error) return { error: error.message }
  } else if (isValidUUID(sessionId)) {
    const { error } = await db.from('comments').delete().eq('id', commentId).eq('session_id', sessionId)
    if (error) return { error: error.message }
  } else {
    return { error: 'unauthorized' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
