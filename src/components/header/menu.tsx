import type { FormEvent } from "react"
import { motion } from "framer-motion"

function getErrorMessage(error: any) {
  return error?.data?.message || error?.message || "请求失败"
}

function LoginPanel({ onDone }: { onDone: () => void }) {
  const { login, passwordLogin, register, enableGithubLogin } = useLogin()
  const toast = useToast()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSucceeded(false)
    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    setPending(true)
    try {
      if (mode === "login")
        await passwordLogin(username, password)
      else
        await register(username, password)
      setSucceeded(true)
      toast(mode === "login" ? "登录成功" : "注册成功，已自动登录", {
        type: "success",
        duration: 2500,
      })
      window.setTimeout(onDone, 450)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="!block !p-2 hover:!bg-transparent">
      <div className="mb-2 grid grid-cols-2 gap-1 rounded-md bg-neutral-400/10 p-1">
        <button
          type="button"
          className={$("rounded px-2 py-1 text-sm", mode === "login" && "bg-base shadow-sm")}
          onClick={() => {
            setMode("login")
            setError("")
            setSucceeded(false)
          }}
        >
          登录
        </button>
        <button
          type="button"
          className={$("rounded px-2 py-1 text-sm", mode === "register" && "bg-base shadow-sm")}
          onClick={() => {
            setMode("register")
            setError("")
            setSucceeded(false)
          }}
        >
          注册
        </button>
      </div>
      <form className="flex flex-col gap-2" onSubmit={submit}>
        <label className="flex items-center gap-2 rounded-md bg-neutral-400/10 px-2 py-1.5">
          <span className="i-ph:user-duotone shrink-0" />
          <input
            value={username}
            onChange={event => setUsername(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="用户名"
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
          />
        </label>
        <label className="flex items-center gap-2 rounded-md bg-neutral-400/10 px-2 py-1.5">
          <span className="i-ph:lock-key-duotone shrink-0" />
          <input
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="密码"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "login" ? 1 : 8}
            maxLength={128}
          />
        </label>
        {mode === "register" && (
          <label className="flex items-center gap-2 rounded-md bg-neutral-400/10 px-2 py-1.5">
            <span className="i-ph:lock-key-open-duotone shrink-0" />
            <input
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="确认密码"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
            />
          </label>
        )}
        {error && <p className="px-1 text-xs color-red-500">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className={$("flex items-center justify-center gap-1 rounded-md px-2 py-1.5 color-white transition-all disabled:opacity-60", succeeded ? "bg-green-500" : "bg-primary")}
        >
          <span className={$(
            pending && "i-ph:circle-notch-duotone animate-spin",
            succeeded && "i-ph:check-circle-duotone",
            !pending && !succeeded && "i-ph:sign-in-duotone",
          )}
          />
          <span>{succeeded ? "成功" : mode === "login" ? "登录" : "注册"}</span>
        </button>
      </form>
      {enableGithubLogin && (
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-neutral-400/10 px-2 py-1.5 hover:bg-neutral-400/15"
          onClick={login}
        >
          <span className="i-ph:github-logo-duotone" />
          <span>Github 账号登录</span>
        </button>
      )}
    </li>
  )
}

// function ThemeToggle() {
//   const { isDark, toggleDark } = useDark()
//   return (
//     <li onClick={toggleDark} className="cursor-pointer [&_*]:cursor-pointer transition-all">
//       <span className={$("inline-block", isDark ? "i-ph-moon-stars-duotone" : "i-ph-sun-dim-duotone")} />
//       <span>
//         {isDark ? "浅色模式" : "深色模式"}
//       </span>
//     </li>
//   )
// }

export function Menu() {
  const { loggedIn, logout, userInfo, enableLogin } = useLogin()
  const [shown, show] = useState(false)
  const menuRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!shown) return

    const closeOnOutside = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      show(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") show(false)
    }

    document.addEventListener("pointerdown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [shown])

  return (
    <span ref={menuRef} className="relative">
      <span className="flex items-center scale-90">
        {
          enableLogin && loggedIn && userInfo.avatar
            ? (
                <button
                  type="button"
                  className="h-6 w-6 rounded-full bg-cover"
                  aria-label="打开菜单"
                  onClick={() => show(v => !v)}
                  style={
                    {
                      backgroundImage: `url(${userInfo.avatar}&s=24)`,
                    }
                  }
                >
                </button>
              )
            : (
                <button
                  type="button"
                  aria-label="打开菜单"
                  className="btn i-si:more-muted-horiz-circle-duotone"
                  onClick={() => show(v => !v)}
                />
              )
        }
      </span>
      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-4 top-4">
          <motion.div
            id="dropdown-menu"
            className={$([
              loggedIn ? "w-200px" : "w-280px",
              "bg-primary backdrop-blur-5 bg-op-70! rounded-lg shadow-xl",
            ])}
            initial={{
              scale: 0.9,
            }}
            animate={{
              scale: 1,
            }}
          >
            <ol className="bg-base bg-op-70! backdrop-blur-md p-2 rounded-lg color-base text-base">
              {enableLogin && (loggedIn
                ? (
                    <>
                      {userInfo.name && (
                        <li>
                          <span className="i-ph:user-circle-duotone inline-block" />
                          <span className="truncate">{userInfo.name}</span>
                        </li>
                      )}
                      <li onClick={logout}>
                        <span className="i-ph:sign-out-duotone inline-block" />
                        <span>退出登录</span>
                      </li>
                    </>
                  )
                : (
                    <LoginPanel onDone={() => show(false)} />
                  ))}
              {/* <ThemeToggle /> */}
              <li onClick={() => window.open(Homepage)} className="cursor-pointer [&_*]:cursor-pointer transition-all">
                <span className="i-ph:github-logo-duotone inline-block" />
                <span>Star on Github </span>
              </li>
              <li className="flex gap-2 items-center">
                <a
                  href="https://github.com/ourongxing/newsnow"
                >
                  <img
                    alt="GitHub stars badge"
                    src="https://img.shields.io/github/stars/ourongxing/newsnow?logo=github&style=flat&labelColor=%235e3c40&color=%23614447"
                  />
                </a>
                <a
                  href="https://github.com/ourongxing/newsnow/fork"
                >
                  <img
                    alt="GitHub forks badge"
                    src="https://img.shields.io/github/forks/ourongxing/newsnow?logo=github&style=flat&labelColor=%235e3c40&color=%23614447"
                  />
                </a>
              </li>
            </ol>
          </motion.div>
        </div>
      )}
    </span>
  )
}
