import { SignJWT } from "jose"
import type { UserInfo } from "#/types"

export async function createUserToken(id: string, type: UserInfo["type"]) {
  return await new SignJWT({
    id,
    type,
  })
    .setExpirationTime("60d")
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!))
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}
