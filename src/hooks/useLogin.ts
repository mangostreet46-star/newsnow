const userAtom = atomWithStorage<{
  name?: string
  avatar?: string
}>("user", {})

const jwtAtom = atomWithStorage("jwt", "")

const enableLoginAtom = atomWithStorage<{
  enable: boolean
  github?: boolean
  url?: string
}>("login", {
  enable: true,
})

interface LoginResponse {
  jwt: string
  user: {
    name?: string
    avatar?: string
  }
}

async function syncLocalMetadataBeforeLogout(jwt: string) {
  const metadata = safeParseString(localStorage.getItem("metadata"))
  if (!metadata?.data) return

  await myFetch("/me/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: {
      data: metadata.data,
      focusTabs: metadata.focusTabs,
      autoRefresh: metadata.autoRefresh,
      updatedTime: metadata.updatedTime,
    },
  })
}

enableLoginAtom.onMount = (set) => {
  myFetch("/enable-login").then((r) => {
    set(r)
  }).catch((e) => {
    if (e.statusCode === 506) {
      set({ enable: false })
      localStorage.removeItem("jwt")
    }
  })
}

export function useLogin() {
  const userInfo = useAtomValue(userAtom)
  const jwt = useAtomValue(jwtAtom)
  const enableLogin = useAtomValue(enableLoginAtom)
  const setUser = useSetAtom(userAtom)
  const setJwt = useSetAtom(jwtAtom)

  const login = useCallback(() => {
    if (enableLogin.url) window.location.href = enableLogin.url
  }, [enableLogin])

  const passwordLogin = useCallback(async (username: string, password: string) => {
    const response = await myFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: {
        username,
        password,
      },
    })
    setUser(response.user)
    setJwt(response.jwt)
  }, [setJwt, setUser])

  const register = useCallback(async (username: string, password: string) => {
    const response = await myFetch<LoginResponse>("/auth/register", {
      method: "POST",
      body: {
        username,
        password,
      },
    })
    setUser(response.user)
    setJwt(response.jwt)
  }, [setJwt, setUser])

  const logout = useCallback(async () => {
    const storedJwt = safeParseString(localStorage.getItem("jwt"))
    if (storedJwt) {
      try {
        await syncLocalMetadataBeforeLogout(storedJwt)
      } catch { }
    }
    window.localStorage.removeItem("jwt")
    window.localStorage.removeItem("user")
    window.localStorage.removeItem("metadata")
    window.location.reload()
  }, [])

  return {
    loggedIn: !!jwt,
    userInfo,
    enableLogin: !!enableLogin.enable,
    enableGithubLogin: !!enableLogin.github && !!enableLogin.url,
    logout,
    login,
    passwordLogin,
    register,
  }
}
