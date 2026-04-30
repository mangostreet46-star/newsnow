const reddit = defineRSSSource("https://www.reddit.com/r/popular/hot/.rss")

export default defineSource(async () => {
  return translateTitlesToChinese(await reddit())
})
