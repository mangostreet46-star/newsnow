function isRecord(target: unknown): target is Record<string, unknown> {
  return typeof target === "object" && target !== null && !Array.isArray(target)
}

export function verifyPrimitiveMetadata(target: unknown) {
  if (!isRecord(target) || typeof target.updatedTime !== "number" || !isRecord(target.data)) {
    throw new Error("Invalid primitive metadata")
  }

  for (const sources of Object.values(target.data)) {
    if (!Array.isArray(sources) || !sources.every(source => typeof source === "string")) {
      throw new Error("Invalid primitive metadata")
    }
  }

  if (target.focusTabs !== undefined) {
    if (!isRecord(target.focusTabs) || typeof target.focusTabs.currentId !== "string" || !Array.isArray(target.focusTabs.tabs)) {
      throw new Error("Invalid primitive metadata")
    }

    for (const tab of target.focusTabs.tabs) {
      if (
        !isRecord(tab)
        || typeof tab.id !== "string"
        || typeof tab.name !== "string"
        || !Array.isArray(tab.sources)
        || !tab.sources.every(source => typeof source === "string")
      ) {
        throw new Error("Invalid primitive metadata")
      }
    }
  }

  if (target.autoRefresh !== undefined) {
    if (
      !isRecord(target.autoRefresh)
      || !Array.isArray(target.autoRefresh.enabledSources)
      || !target.autoRefresh.enabledSources.every(source => typeof source === "string")
    ) {
      throw new Error("Invalid primitive metadata")
    }
  }
}
