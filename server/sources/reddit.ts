const redditAI = defineRSSSource("https://www.reddit.com/r/artificial+MachineLearning+programming/hot/.rss")
const redditTech = defineRSSSource("https://www.reddit.com/r/technology+Futurology+gadgets/hot/.rss")
const redditWorld = defineRSSSource("https://www.reddit.com/r/worldnews+news/hot/.rss")
const redditFinance = defineRSSSource("https://www.reddit.com/r/investing+stocks/hot/.rss")
const redditSecurity = defineRSSSource("https://www.reddit.com/r/cybersecurity+netsec/hot/.rss")

function withChineseTitles(source: ReturnType<typeof defineRSSSource>) {
  return defineSource(async () => {
    return translateTitlesToChinese(await source())
  })
}

export default defineSource({
  "reddit": withChineseTitles(redditAI),
  "reddit-ai": withChineseTitles(redditAI),
  "reddit-tech": withChineseTitles(redditTech),
  "reddit-world": withChineseTitles(redditWorld),
  "reddit-finance": withChineseTitles(redditFinance),
  "reddit-security": withChineseTitles(redditSecurity),
})
