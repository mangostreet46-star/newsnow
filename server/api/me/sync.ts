import process from "node:process"
import { UserTable } from "#/database/user"

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.user
    const db = useDatabase()
    if (!db) throw new Error("Not found database")
    const userTable = new UserTable(db)
    if (process.env.INIT_TABLE !== "false") await userTable.init()
    if (event.method === "GET") {
      const { data, updated } = await userTable.getData(id)
      const parsed = data ? JSON.parse(data) : undefined
      if (parsed?.data) {
        return {
          data: parsed.data,
          focusTabs: parsed.focusTabs,
          autoRefresh: parsed.autoRefresh,
          updatedTime: updated,
        }
      }
      return {
        data: parsed,
        updatedTime: updated,
      }
    } else if (event.method === "POST") {
      const body = await readBody(event)
      verifyPrimitiveMetadata(body)
      const { updatedTime, data, focusTabs, autoRefresh } = body
      await userTable.setData(id, JSON.stringify({ data, focusTabs, autoRefresh }), updatedTime)
      return {
        success: true,
        updatedTime,
      }
    }
  } catch (e) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
