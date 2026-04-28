import type { SourceID } from "@shared/types"
import { createPortal } from "react-dom"

interface FocusTabSelectorProps {
  sourceId: SourceID
  open: boolean
  defaultToCurrentTab?: boolean
  portal?: boolean
  onClose: () => void
}

export function FocusTabSelector({ sourceId, open, defaultToCurrentTab, portal = true, onClose }: FocusTabSelectorProps) {
  const focusTabs = useAtomValue(focusTabsAtom)
  const dispatch = useSetAtom(focusTabActionsAtom)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    const existingIds = focusTabs.tabs
      .filter(tab => tab.sources.includes(sourceId))
      .map(tab => tab.id)
    const initialIds = existingIds.length
      ? existingIds
      : defaultToCurrentTab && focusTabs.tabs.some(tab => tab.id === focusTabs.currentId)
        ? [focusTabs.currentId]
        : []
    setSelectedIds(initialIds)
  }, [defaultToCurrentTab, focusTabs.currentId, focusTabs.tabs, open, sourceId])

  if (!open) return null

  const selectedSet = new Set(selectedIds)
  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id)
      ? prev.filter(item => item !== id)
      : [...prev, id])
  }
  const save = () => {
    dispatch({
      type: "set-source-tabs",
      source: sourceId,
      tabIds: selectedIds,
    })
    onClose()
  }

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-op-40"
      style={{ zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="w-330px max-w-[calc(100vw-32px)] rounded-2xl bg-base p-4 shadow-2xl sprinkle-primary"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm op-60">选择关注分组</div>
            <div className="truncate text-lg font-bold">{sources[sourceId]?.name ?? sourceId}</div>
          </div>
          <button
            type="button"
            className="btn i-ph:x-duotone shrink-0"
            title="关闭"
            onClick={onClose}
          />
        </div>

        <div className="flex max-h-260px flex-col gap-2 overflow-y-auto py-1">
          {focusTabs.tabs.map(tab => {
            const checked = selectedSet.has(tab.id)
            return (
              <button
                key={tab.id}
                type="button"
                className={$("flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors", checked ? "bg-primary bg-op-15" : "bg-neutral-400/10 hover:bg-neutral-400/15")}
                onClick={() => toggle(tab.id)}
              >
                <span className="truncate">{tab.name}</span>
                <span className={$(checked ? "i-ph:check-square-duotone" : "i-ph:square-duotone", "ml-3 shrink-0 text-lg color-primary")} />
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm bg-neutral-400/10"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm bg-primary color-base"
            onClick={save}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )

  return portal ? createPortal(content, document.body) : content
}
