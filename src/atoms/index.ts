import type { FixedColumnID, FocusTabsState, SourceID } from "@shared/types"
import type { Update } from "./types"

function createFocusTabId() {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function getFocusTabsState(state: FocusTabsState | undefined, focusSources: SourceID[]): FocusTabsState {
  if (state?.tabs?.length) return state
  return {
    currentId: "default",
    tabs: [{
      id: "default",
      name: "默认",
      sources: focusSources,
    }],
  }
}

export const focusSourcesAtom = atom((get) => {
  return get(primitiveMetadataAtom).data.focus
}, (get, set, update: Update<SourceID[]>) => {
  const previous = get(focusSourcesAtom)
  const _ = update instanceof Function ? update(previous) : update
  const previousSet = new Set(previous)
  const nextSet = new Set(_)
  const added = _.filter(id => !previousSet.has(id))
  const removed = previous.filter(id => !nextSet.has(id))
  const focusTabs = getFocusTabsState(get(primitiveMetadataAtom).focusTabs, previous)
  const currentId = focusTabs.tabs.some(tab => tab.id === focusTabs.currentId)
    ? focusTabs.currentId
    : focusTabs.tabs[0].id
  const tabs = focusTabs.tabs.map((tab, index) => {
    const withoutRemoved = tab.sources.filter(id => !removed.includes(id) && nextSet.has(id))
    if (tab.id === currentId || (!focusTabs.tabs.some(tab => tab.id === currentId) && index === 0)) {
      return {
        ...tab,
        sources: [...withoutRemoved, ...added.filter(id => !withoutRemoved.includes(id))],
      }
    }
    return {
      ...tab,
      sources: withoutRemoved,
    }
  })

  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    focusTabs: {
      currentId,
      tabs,
    },
    data: {
      ...get(primitiveMetadataAtom).data,
      focus: _,
    },
  })
})

export const currentColumnIDAtom = atom<FixedColumnID>("focus")

export const focusTabsAtom = atom((get) => {
  return getFocusTabsState(get(primitiveMetadataAtom).focusTabs, get(focusSourcesAtom))
}, (get, set, update: Update<FocusTabsState>) => {
  const next = update instanceof Function ? update(get(focusTabsAtom)) : update
  const focusSources = [...new Set(next.tabs.flatMap(tab => tab.sources).filter(id => sources[id]))] as SourceID[]
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    focusTabs: next,
    data: {
      ...get(primitiveMetadataAtom).data,
      focus: focusSources,
    },
  })
})

export const currentFocusTabAtom = atom((get) => {
  const focusTabs = get(focusTabsAtom)
  return focusTabs.tabs.find(tab => tab.id === focusTabs.currentId) ?? focusTabs.tabs[0]
})

export const currentFocusTabSourcesAtom = atom((get) => {
  return get(currentFocusTabAtom)?.sources ?? []
}, (get, set, update: Update<SourceID[]>) => {
  const currentTab = get(currentFocusTabAtom)
  if (!currentTab) return
  const nextSources = update instanceof Function ? update(currentTab.sources) : update
  set(focusTabsAtom, prev => ({
    ...prev,
    tabs: prev.tabs.map(tab => tab.id === currentTab.id ? { ...tab, sources: nextSources } : tab),
  }))
})

export const focusTabActionsAtom = atom(null, (get, set, action: {
  type: "select" | "add" | "rename" | "delete" | "move-source" | "move-source-by-name" | "set-source-tabs"
  id?: string
  name?: string
  source?: SourceID
  tabIds?: string[]
}) => {
  const focusTabs = get(focusTabsAtom)
  if (action.type === "select" && action.id) {
    set(focusTabsAtom, {
      ...focusTabs,
      currentId: action.id,
    })
  } else if (action.type === "add") {
    const id = createFocusTabId()
    set(focusTabsAtom, {
      currentId: id,
      tabs: [...focusTabs.tabs, {
        id,
        name: action.name?.trim() || "新分组",
        sources: [],
      }],
    })
  } else if (action.type === "rename" && action.id && action.name?.trim()) {
    set(focusTabsAtom, {
      ...focusTabs,
      tabs: focusTabs.tabs.map(tab => tab.id === action.id ? { ...tab, name: action.name!.trim() } : tab),
    })
  } else if (action.type === "delete" && action.id && focusTabs.tabs.length > 1) {
    const deleted = focusTabs.tabs.find(tab => tab.id === action.id)
    if (!deleted) return
    const remaining = focusTabs.tabs.filter(tab => tab.id !== action.id)
    const targetIndex = Math.max(0, focusTabs.tabs.findIndex(tab => tab.id === action.id) - 1)
    const target = remaining[targetIndex] ?? remaining[0]
    set(focusTabsAtom, {
      currentId: focusTabs.currentId === action.id ? target.id : focusTabs.currentId,
      tabs: remaining.map(tab => tab.id === target.id ? { ...tab, sources: [...tab.sources, ...deleted.sources] } : tab),
    })
  } else if (action.type === "move-source" && action.id && action.source) {
    const nextTabs = focusTabs.tabs.map(tab => ({
      ...tab,
      sources: tab.sources.filter(id => id !== action.source),
    })).map(tab => tab.id === action.id
      ? { ...tab, sources: [...tab.sources, action.source!] }
      : tab)
    set(focusTabsAtom, {
      ...focusTabs,
      currentId: action.id,
      tabs: nextTabs,
    })
  } else if (action.type === "move-source-by-name" && action.name?.trim() && action.source) {
    const name = action.name.trim()
    const existing = focusTabs.tabs.find(tab => tab.name === name)
    const targetId = existing?.id ?? createFocusTabId()
    const tabs = existing
      ? focusTabs.tabs
      : [...focusTabs.tabs, { id: targetId, name, sources: [] }]
    const nextTabs = tabs.map(tab => ({
      ...tab,
      sources: tab.sources.filter(id => id !== action.source),
    })).map(tab => tab.id === targetId
      ? { ...tab, sources: [...tab.sources, action.source!] }
      : tab)
    set(focusTabsAtom, {
      currentId: targetId,
      tabs: nextTabs,
    })
  } else if (action.type === "set-source-tabs" && action.source && action.tabIds) {
    const selectedTabIds = new Set(action.tabIds)
    set(focusTabsAtom, {
      ...focusTabs,
      tabs: focusTabs.tabs.map(tab => ({
        ...tab,
        sources: selectedTabIds.has(tab.id)
          ? tab.sources.includes(action.source!)
            ? tab.sources
            : [...tab.sources, action.source!]
          : tab.sources.filter(id => id !== action.source),
      })),
    })
  }
})

export const currentSourcesAtom = atom((get) => {
  const id = get(currentColumnIDAtom)
  if (id === "focus") return get(currentFocusTabSourcesAtom)
  return get(primitiveMetadataAtom).data[id]
}, (get, set, update: Update<SourceID[]>) => {
  if (get(currentColumnIDAtom) === "focus") {
    set(currentFocusTabSourcesAtom, update)
    return
  }
  const _ = update instanceof Function ? update(get(currentSourcesAtom)) : update
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      [get(currentColumnIDAtom)]: _,
    },
  })
})

export const autoRefreshSourcesAtom = atom((get) => {
  return get(primitiveMetadataAtom).autoRefresh?.enabledSources ?? []
}, (get, set, update: Update<SourceID[]>) => {
  const next = update instanceof Function ? update(get(autoRefreshSourcesAtom)) : update
  const enabledSources = [...new Set(next.filter(id => sources[id]))] as SourceID[]

  set(primitiveMetadataAtom, {
    ...get(primitiveMetadataAtom),
    updatedTime: Date.now(),
    action: "manual",
    autoRefresh: {
      enabledSources,
    },
  })
})

export const goToTopAtom = atom({
  ok: false,
  el: undefined as HTMLElement | undefined,
  fn: undefined as (() => void) | undefined,
})
