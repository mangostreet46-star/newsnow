import { XMLParser } from "fast-xml-parser"
import type { NewsItem } from "@shared/types"

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
})

function text(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (value && typeof value === "object" && "#text" in value) return String(value["#text" as keyof typeof value])
  return ""
}

function definePANewsSource(type: "NEWS" | "NORMAL") {
  return defineSource(async () => {
    const xml: string = await myFetch(`https://www.panewslab.com/rss.xml?lang=zh&type=${type}`, {
      responseType: "text",
    })
    const result = parser.parse(xml)
    const channel = result?.rss?.channel
    if (!channel) throw new Error("Cannot parse PANews RSS")

    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)
    return items.map((item: any): NewsItem => ({
      id: text(item.guid) || item.link,
      title: text(item.title),
      url: item.link,
      pubDate: item.pubDate,
      extra: {
        hover: text(item.description),
      },
    }))
  })
}

export default defineSource({
  "panews-flash": definePANewsSource("NEWS"),
  "panews-article": definePANewsSource("NORMAL"),
})
