import process from "node:process"
import { z } from "zod"
import { LocalAccountTable } from "#/database/local-account"
import { createUserToken, normalizeUsername } from "#/utils/auth"
import { verifyPassword } from "#/utils/password"

const loginSchema = z.object({
  username: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(128),
})

export default defineEventHandler(async (event) => {
  if (!process.env.JWT_SECRET)
    throw createError({ statusCode: 506, message: "Server not configured, disable login" })

  const body = loginSchema.safeParse(await readBody(event))
  if (!body.success)
    throw createError({ statusCode: 400, message: "用户名或密码格式不正确" })

  const username = normalizeUsername(body.data.username)
  const db = useDatabase()
  const accountTable = new LocalAccountTable(db)
  if (process.env.INIT_TABLE !== "false") await accountTable.init()

  const account = await accountTable.getByUsername(username)
  if (!account || !(await verifyPassword(body.data.password, account.password_hash, account.password_salt)))
    throw createError({ statusCode: 401, message: "用户名或密码错误" })

  return {
    jwt: await createUserToken(account.user_id, "local"),
    user: {
      name: account.username,
    },
  }
})
