interface BuzzingFeed {
  items?: BuzzingItem[]
}

interface BuzzingItem {
  id?: string
  url?: string
  title?: string
  summary?: string
  date_published?: string
  _original_published?: string
  tags?: string[]
}

function createBuzzingSource(url: string) {
  return defineSource(async () => {
    const data = await myFetch<BuzzingFeed>(url)
    if (!data.items?.length) throw new Error("Cannot fetch buzzing data")

    return data.items
      .filter(item => item.title && (item.url || item.id))
      .map(item => ({
        title: item.title!,
        url: item.url ?? item.id!,
        id: item.id ?? item.url!,
        pubDate: item._original_published ?? item.date_published,
        extra: {
          hover: item.summary,
          info: item.tags?.join(", "),
        },
      }))
  })
}

export default defineSource({
  "buzzing": createBuzzingSource("https://news.buzzing.cc/feed.json"),
  "buzzing-hn": createBuzzingSource("https://hn.buzzing.cc/feed.json"),
})
