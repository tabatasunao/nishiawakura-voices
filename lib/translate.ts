import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a professional translator specializing in Japanese civic and governmental documents.
Translate the following Japanese text to natural, formal English suitable for a public policy platform.
Preserve the meaning, tone, and structure exactly. Return only the translated text, nothing else.`

export async function translateToEnglish(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
  })
  return response.choices[0].message.content ?? text
}
