import process from "node:process"
import { UserTable } from "#/database/user"
import { createUserToken } from "#/utils/auth"

export default defineEventHandler(async (event) => {
  if (!process.env.G_CLIENT_ID || !process.env.G_CLIENT_SECRET)
    throw createError({ statusCode: 506, message: "GitHub login is not configured" })

  const db = useDatabase()
  const userTable = db ? new UserTable(db) : undefined
  if (!userTable) throw new Error("db is not defined")
  if (process.env.INIT_TABLE !== "false") await userTable.init()

  const response: {
    access_token: string
    token_type: string
    scope: string
  } = await myFetch(
    `https://github.com/login/oauth/access_token`,
    {
      method: "POST",
      body: {
        client_id: process.env.G_CLIENT_ID,
        client_secret: process.env.G_CLIENT_SECRET,
        code: getQuery(event).code,
      },
      headers: {
        accept: "application/json",
      },
    },
  )

  const userInfo: {
    id: number
    name: string
    avatar_url: string
    email: string
    notification_email: string
  } = await myFetch(`https://api.github.com/user`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `token ${response.access_token}`,
      // 必须有 user-agent，在 cloudflare worker 会报错
      "User-Agent": "NewsNow App",
    },
  })

  const userID = String(userInfo.id)
  await userTable.addUser(userID, userInfo.notification_email || userInfo.email, "github")

  const jwtToken = await createUserToken(userID, "github")

  // nitro 有 bug，在 cloudflare 里没法 set cookie
  // seconds
  // const maxAge = 60 * 24 * 60 * 60
  // setCookie(event, "user_jwt", jwtToken, { maxAge })
  // setCookie(event, "user_avatar", userInfo.avatar_url, { maxAge })
  // setCookie(event, "user_name", userInfo.name, { maxAge })

  const params = new URLSearchParams({
    login: "github",
    jwt: jwtToken,
    user: JSON.stringify({
      avatar: userInfo.avatar_url,
      name: userInfo.name,
    }),
  })
  return sendRedirect(event, `/?${params.toString()}`)
})
