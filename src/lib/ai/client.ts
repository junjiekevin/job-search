import OpenAI from 'openai'
import type { z } from 'zod'

const PRIMARY_MODEL = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-v4-flash'
const FALLBACK_MODELS = ['openai/gpt-5-mini', 'google/gemma-4-26b-a4b-it']

type Usage = { prompt_tokens: number; completion_tokens: number }

function getClient(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  })
}

function getContent(response: OpenAI.Chat.Completions.ChatCompletion): string {
  const choice = response.choices[0]
  if (!choice?.message?.content) {
    throw new Error(`LLM returned empty response — finish_reason: ${choice?.finish_reason ?? 'none'}`)
  }
  return choice.message.content
}

function getUsage(response: OpenAI.Chat.Completions.ChatCompletion): Usage {
  return {
    prompt_tokens: response.usage?.prompt_tokens ?? 0,
    completion_tokens: response.usage?.completion_tokens ?? 0,
  }
}

export async function complete(
  system: string,
  user: string,
  opts?: { model?: string },
): Promise<{ content: string; usage: Usage; model: string }> {
  const openai = getClient()
  const response = await openai.chat.completions.create({
    model: opts?.model ?? PRIMARY_MODEL,
    ...(opts?.model ? {} : { extra_body: { models: FALLBACK_MODELS } }),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  return {
    content: getContent(response),
    usage: getUsage(response),
    model: response.model,
  }
}

export async function completeJSON<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  opts?: { model?: string },
): Promise<{ data: T; usage: Usage; model: string }> {
  const openai = getClient()
  const response = await openai.chat.completions.create({
    model: opts?.model ?? PRIMARY_MODEL,
    ...(opts?.model ? {} : { extra_body: { models: FALLBACK_MODELS } }),
    messages: [
      { role: 'system', content: `${system}\n\nRespond with valid JSON only.` },
      { role: 'user', content: user },
    ],
  })

  const text = getContent(response)
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('LLM returned malformed JSON')
  }
  const data = schema.parse(parsed)

  return {
    data,
    usage: getUsage(response),
    model: response.model,
  }
}
