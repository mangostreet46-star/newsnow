import process from "node:process"
import { z } from "zod"
import { LocalAccountTable } from "#/database/local-account"
import { UserTable } from "#/database/user"
import { createUserToken, normalizeUsername } from "#/utils/auth"
import { hashPassword } from "#/utils/password"

const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[\w.-]+$/),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  if (!process.env.JWT_SECRET)
    throw createError({ statusCode: 506, message: "Server not configured, disable login" })

  const body = registerSchema.safeParse(await readBody(event))
  if (!body.success)
    throw createError({ statusCode: 400, message: "用户名或密码格式不正确" })

  const username = normalizeUsername(body.data.username)
  const db = useDatabase()
  const userTable = new UserTable(db)
  const accountTable = new LocalAccountTable(db)
  if (process.env.INIT_TABLE !== "false") {
    await userTable.init()
    await accountTable.init()
  }

  const exists = await accountTable.getByUsername(username)
  if (exists)
    throw createError({ statusCode: 409, message: "用户名已存在" })

  const userID = `local:${username}`
  const { hash, salt } = await hashPassword(body.data.password)
  await userTable.addUser(userID, username, "local")
  await accountTable.addAccount(userID, username, hash, salt)

  return {
    jwt: await createUserToken(userID, "local"),
    user: {
      name: username,
    },
  }
})
