import { ourongxing, react } from "@ourongxing/eslint-config"

const reactConfigs = await react({
  files: ["src/**"],
})
const tsconfigRootDir = import.meta.dirname

const pluginRules = new Map()

for (const config of reactConfigs) {
  for (const [pluginName, plugin] of Object.entries(config.plugins ?? {})) {
    pluginRules.set(pluginName, new Set(Object.keys(plugin.rules ?? {})))
  }
}

for (const config of reactConfigs) {
  config.languageOptions ??= {}
  config.languageOptions.parserOptions = {
    ...config.languageOptions.parserOptions,
    projectService: true,
    tsconfigRootDir,
  }

  if (!config.rules) continue

  for (const ruleName of Object.keys(config.rules)) {
    const [pluginName, rule] = ruleName.split("/")
    if (rule && pluginRules.has(pluginName) && !pluginRules.get(pluginName).has(rule)) {
      delete config.rules[ruleName]
    }
  }
}

export default ourongxing({
  type: "app",
  // 貌似不能 ./ 开头，
  ignores: ["src/routeTree.gen.ts", "imports.app.d.ts", "public/", ".vscode", "**/*.json"],
}).append(reactConfigs)
