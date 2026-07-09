import process from "node:process"
import { SignJWT } from "jose"
import type { UserInfo } from "#/types"

export async function createUserToken(id: string, type: UserInfo["type"]) {
  return await new SignJWT({
    id,
    type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!))
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}
