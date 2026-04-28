import * as cheerio from "cheerio"
import iconv from "iconv-lite"
import type { NewsItem } from "@shared/types"

const baseURL = "https://www.gzu521.net"

export default defineSource(async () => {
  const data: ArrayBuffer = await myFetch(`${baseURL}/infotype-53-0.html`, {
    responseType: "arrayBuffer",
    headers: {
      Referer: `${baseURL}/`,
    },
  })
  const html = iconv.decode(Buffer.from(data), "gb2312")
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $(".list-item").each((_, el) => {
    const a = $(el).find(".item-title").first()
    const href = a.attr("href")
    const title = (a.attr("title") || a.clone().children().remove().end().text()).trim()
    const date = $(el).find(".item-date").first().text().trim()
    const desc = $(el).find(".item-desc").first().text().replace(/\s+/g, " ").trim()

    if (!href || !title) return
    const url = new URL(href, baseURL).toString()
    news.push({
      id: url,
      title,
      url,
      pubDate: date,
      extra: {
        hover: desc,
      },
    })
  })

  return news
})
