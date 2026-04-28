import process from "node:process"

export default defineEventHandler(async () => {
  const github = !!(process.env.G_CLIENT_ID && process.env.G_CLIENT_SECRET)
  return {
    enable: !!process.env.JWT_SECRET,
    github,
    url: github ? `https://github.com/login/oauth/authorize?client_id=${process.env.G_CLIENT_ID}` : undefined,
  }
})
