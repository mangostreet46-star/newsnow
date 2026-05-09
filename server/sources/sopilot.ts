export default defineSource(async () => {
  const data = await rss2json("https://sopilot.net/rss/hottweets")
  function getTweetText(description?: string) {
    return description?.replace(/\n+❤️[\s\S]*$/, "").trim()
  }

  function getOriginalUrl(description?: string) {
    return description?.match(/原推链接:\s*(https?:\/\/\S+)/)?.[1]
  }

  function getTweetStats(description?: string) {
    const matches = description?.match(/❤️\s*([\d,]+)\s*🔁\s*([\d,]+)\s*💬\s*([\d,]+)\s*🔖\s*([\d,]+)\s*👀\s*([\d,]+)/)
    if (!matches) return
    const [, likes, retweets, comments, bookmarks, views] = matches
    return `❤️ ${likes} 🔁 ${retweets} 💬 ${comments} 🔖 ${bookmarks} 👀 ${views}`
  }

  return data?.items.map(item => ({
    title: getTweetText(item.description) || item.title,
    url: getOriginalUrl(item.description) || item.link,
    id: item.link,
    pubDate: item.created,
    extra: {
      info: [item.title, getTweetStats(item.description)].filter(Boolean).join(" · "),
      hover: getTweetText(item.description),
    },
  })) ?? []
})
