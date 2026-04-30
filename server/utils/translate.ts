import process from "node:process"
import type { NewsItem } from "@shared/types"

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

interface LibreTranslateResponse {
  translatedText?: string
}

type TranslateProvider = "libretranslate" | "openai"

function getTranslateProvider(): TranslateProvider {
  return process.env.TRANSLATE_PROVIDER === "libretranslate" ? "libretranslate" : "openai"
}

function getOpenAIEndpoint() {
  if (process.env.TRANSLATE_API_URL) return process.env.TRANSLATE_API_URL
  if (process.env.OPENAI_BASE_URL) return new URL("/v1/chat/completions", process.env.OPENAI_BASE_URL).toString()
  return "https://api.openai.com/v1/chat/completions"
}

function getLibreTranslateEndpoint() {
  return process.env.TRANSLATE_API_URL || "http://localhost:5000/translate"
}

function parseTranslatedTitles(content: string, count: number) {
  const json = content.match(/\[[\s\S]*\]/)?.[0] ?? content
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed) || parsed.length !== count) {
    throw new Error("Unexpected translation response")
  }
  return parsed.map(item => String(item).trim())
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

async function translateTitlesWithOpenAI(items: NewsItem[]) {
  const apiKey = process.env.TRANSLATE_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey || !items.length) return items

  const titles = items.map(item => item.title)

  const response = await myFetch<OpenAIChatResponse>(getOpenAIEndpoint(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      model: process.env.TRANSLATE_MODEL || "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "Translate news and forum post titles into concise Simplified Chinese. Preserve names, URLs, numbers, product names, and existing Chinese. Return only a JSON string array with the same length and order as the input.",
        },
        {
          role: "user",
          content: JSON.stringify(titles),
        },
      ],
    },
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) throw new Error("Empty translation response")

  return applyTranslatedTitles(items, parseTranslatedTitles(content, items.length))
}

async function translateTitlesWithLibreTranslate(items: NewsItem[]) {
  const apiKey = process.env.TRANSLATE_API_KEY
  const target = process.env.TRANSLATE_TARGET || "zh"
  const source = process.env.TRANSLATE_SOURCE || "en"
  const endpoint = getLibreTranslateEndpoint()
  const concurrency = Number(process.env.TRANSLATE_CONCURRENCY || 2)

  const translatedTitles = await mapWithConcurrency(items, concurrency, async (item) => {
    try {
      const response = await myFetch<LibreTranslateResponse>(endpoint, {
        method: "POST",
        timeout: Number(process.env.TRANSLATE_TIMEOUT || 30000),
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          q: item.title,
          source,
          target,
          format: "text",
          api_key: apiKey || undefined,
        },
      })

      return response.translatedText?.trim() || item.title
    } catch (error) {
      logger.error(error)
      return item.title
    }
  })

  return applyTranslatedTitles(items, translatedTitles)
}

function applyTranslatedTitles(items: NewsItem[], translatedTitles: string[]) {
  return items.map((item, index) => {
    const translatedTitle = translatedTitles[index] || item.title
    if (translatedTitle === item.title) return item
    return {
      ...item,
      title: translatedTitle,
      extra: {
        ...item.extra,
        hover: item.extra?.hover ?? item.title,
      },
    }
  })
}

export async function translateTitlesToChinese(items: NewsItem[]) {
  if (!items.length) return items

  try {
    if (getTranslateProvider() === "libretranslate") return await translateTitlesWithLibreTranslate(items)
    return await translateTitlesWithOpenAI(items)
  } catch (error) {
    logger.error(error)
    return items
  }
}
