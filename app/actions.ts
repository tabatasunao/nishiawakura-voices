'use server'

import { timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'
import { isValidTagList } from '@/lib/tags'

const SUGGESTED_TAG_LIST = '財政, 人口, 産業, 林業, 農業, 観光, 教育, 医療福祉, インフラ, 脱炭素, その他'

const POLISH_COMMENT_PROMPT = 'あなたは市民参加プラットフォームのライティングアシスタントです。ユーザーの粗削りな入力を、読みやすく丁寧な日本語の文章に整えてください。元の意図・主張は変えずに、完成した文章として仕上げてください。整えたテキストのみを返してください。'

export async function polishText(roughText: string, type: 'comment'): Promise<{ polished?: string; error?: string }> {
  if (!process.env.OPENAI_API_KEY) return { error: 'unavailable' }
  const trimmed = roughText.trim()
  if (!trimmed || trimmed.length > 1000) return { error: 'invalid' }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: POLISH_COMMENT_PROMPT },
        { role: 'user', content: trimmed },
      ],
      temperature: 0.4,
      max_tokens: 500,
    })
    const result = response.choices[0].message.content?.trim()
    if (!result) return { error: 'empty_response' }
    return { polished: result }
  } catch {
    return { error: 'failed' }
  }
}

export async function generateProposal(roughText: string): Promise<{
  title?: string; body?: string; tags?: string[]; error?: string
}> {
  if (!process.env.OPENAI_API_KEY) return { error: 'unavailable' }
  const trimmed = roughText.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'invalid' }

  const systemPrompt = `あなたは西粟倉村の選挙公開質問状プラットフォームのアシスタントです。
村民が候補者に聞きたいことを粗削りに入力します。
それをもとに、以下のJSON形式で政策質問を生成してください。

{
  "title": "質問タイトル（100文字以内、簡潔なテーマ）",
  "body": "候補者への質問本文（丁寧で具体的な日本語、500文字以内）",
  "tags": ["タグ"] // 次のリストから内容に合う1〜3個を選ぶ: ${SUGGESTED_TAG_LIST}
}

JSONのみ返してください。説明は不要です。`

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trimmed },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })
    const raw = response.choices[0].message.content?.trim()
    if (!raw) return { error: 'empty_response' }

    const parsed = JSON.parse(raw)
    const title = typeof parsed.title === 'string' ? parsed.title.slice(0, 100).trim() : null
    const body = typeof parsed.body === 'string' ? parsed.body.slice(0, 1000).trim() : null
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5) as string[]
      : []

    if (!title || !body) return { error: 'invalid_response' }
    return { title, body, tags }
  } catch {
    return { error: 'failed' }
  }
}

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
