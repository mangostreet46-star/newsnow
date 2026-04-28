import type { PrimitiveAtom } from "jotai"
import type { AutoRefreshState, FixedColumnID, FocusTabsState, PrimitiveMetadata, SourceID } from "@shared/types"
import type { Update } from "./types"

function createPrimitiveMetadataAtom(
  key: string,
  initialValue: PrimitiveMetadata,
  preprocess: ((stored: PrimitiveMetadata) => PrimitiveMetadata),
): PrimitiveAtom<PrimitiveMetadata> {
  const getInitialValue = (): PrimitiveMetadata => {
    const item = localStorage.getItem(key)
    try {
      if (item) {
        const stored = JSON.parse(item) as PrimitiveMetadata
        verifyPrimitiveMetadata(stored)
        return preprocess({
          ...stored,
          action: "init",
        })
      }
    } catch { }
    return initialValue
  }
  const baseAtom = atom(getInitialValue())
  const derivedAtom = atom(get => get(baseAtom), (get, set, update: Update<PrimitiveMetadata>) => {
    const nextValue = update instanceof Function ? update(get(baseAtom)) : update
    if (nextValue.action === "sync" || nextValue.updatedTime > get(baseAtom).updatedTime) {
      set(baseAtom, nextValue)
      localStorage.setItem(key, JSON.stringify(nextValue))
    }
  })
  return derivedAtom
}

const initialMetadata = typeSafeObjectFromEntries(typeSafeObjectEntries(metadata)
  .filter(([id]) => fixedColumnIds.includes(id as any))
  .map(([id, val]) => [id, val.sources] as [FixedColumnID, SourceID[]]))

function createFocusTabId() {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function preprocessFocusTabs(target: PrimitiveMetadata, focusSources: SourceID[]): FocusTabsState {
  const assigned = new Set<SourceID>()
  const validFocusSources = new Set(focusSources)
  const rawTabs = Array.isArray(target.focusTabs?.tabs) ? target.focusTabs.tabs : []
  const tabs = rawTabs
    .map((tab, index) => {
      const tabAssigned = new Set<SourceID>()
      const tabSources = (Array.isArray(tab.sources) ? tab.sources : [])
        .filter((id): id is SourceID => {
          if (!sources[id] || !validFocusSources.has(id) || tabAssigned.has(id)) return false
          tabAssigned.add(id)
          return true
        })
      tabSources.forEach(id => assigned.add(id))
      return {
        id: tab.id || (index === 0 ? "default" : createFocusTabId()),
        name: tab.name?.trim() || (index === 0 ? "默认" : `分组 ${index + 1}`),
        sources: tabSources,
      }
    })
    .filter(tab => tab.name)

  const unassigned = focusSources.filter(id => !assigned.has(id))
  if (!tabs.length) {
    tabs.push({
      id: "default",
      name: "默认",
      sources: unassigned,
    })
  } else if (unassigned.length) {
    tabs[0] = {
      ...tabs[0],
      sources: [...tabs[0].sources, ...unassigned],
    }
  }

  const currentId = tabs.some(tab => tab.id === target.focusTabs?.currentId)
    ? target.focusTabs!.currentId
    : tabs[0].id

  return {
    currentId,
    tabs,
  }
}

function preprocessAutoRefresh(target: PrimitiveMetadata): AutoRefreshState {
  const enabledSources = (Array.isArray(target.autoRefresh?.enabledSources) ? target.autoRefresh.enabledSources : [])
    .filter((id, index, list): id is SourceID => !!sources[id] && list.indexOf(id) === index)

  return {
    enabledSources,
  }
}

export function preprocessMetadata(target: PrimitiveMetadata) {
  const data = {
    ...initialMetadata,
    ...typeSafeObjectFromEntries(
      typeSafeObjectEntries(target.data)
        .filter(([id]) => initialMetadata[id])
        .map(([id, s]) => {
          if (id === "focus") return [id, s.filter(k => sources[k]).map(k => sources[k].redirect ?? k)]
          const oldS = s.filter(k => initialMetadata[id].includes(k)).map(k => sources[k].redirect ?? k)
          const newS = initialMetadata[id].filter(k => !oldS.includes(k))
          return [id, [...oldS, ...newS]]
        }),
    ),
  }

  return {
    data,
    focusTabs: preprocessFocusTabs(target, data.focus),
    autoRefresh: preprocessAutoRefresh(target),
    action: target.action,
    updatedTime: target.updatedTime,
  } as PrimitiveMetadata
}

export function createInitialPrimitiveMetadata(action: PrimitiveMetadata["action"] = "init", updatedTime = 0) {
  return preprocessMetadata({
    updatedTime,
    data: initialMetadata,
    focusTabs: {
      currentId: "default",
      tabs: [{
        id: "default",
        name: "默认",
        sources: [],
      }],
    },
    autoRefresh: {
      enabledSources: [],
    },
    action,
  })
}

export const primitiveMetadataAtom = createPrimitiveMetadataAtom("metadata", createInitialPrimitiveMetadata(), preprocessMetadata)
