import { getRandomValues, subtle } from "uncrypto"

const iterations = 210000
const keyLength = 256

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    keyLength,
  )
  return toHex(new Uint8Array(bits))
}

export async function hashPassword(password: string) {
  const salt = getRandomValues(new Uint8Array(16))
  return {
    hash: await derivePasswordHash(password, salt),
    salt: toHex(salt),
  }
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = await derivePasswordHash(password, fromHex(salt))
  return candidate === hash
}
