import type { FixedColumnID } from "@shared/types"
import { useTitle } from "react-use"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { currentColumnIDAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  useEffect(() => {
    setCurrentColumnID(id)
  }, [id, setCurrentColumnID])

  useTitle(`NewsNow | ${metadata[id].name}`)

  return (
    <>
      <div className="flex justify-center md:hidden mb-6">
        <NavBar />
      </div>
      {id === "focus" && <FocusTabsBar />}
      {id === currentColumnID && <Dnd />}
    </>
  )
}

function FocusTabsBar() {
  const focusTabs = useAtomValue(focusTabsAtom)
  const dispatch = useSetAtom(focusTabActionsAtom)
  const currentTab = focusTabs.tabs.find(tab => tab.id === focusTabs.currentId) ?? focusTabs.tabs[0]

  const addTab = useCallback(() => {
    const name = window.prompt("新分组名称")
    if (name?.trim()) dispatch({ type: "add", name })
  }, [dispatch])

  const renameTab = useCallback(() => {
    if (!currentTab) return
    const name = window.prompt("分组名称", currentTab.name)
    if (name?.trim()) dispatch({ type: "rename", id: currentTab.id, name })
  }, [currentTab, dispatch])

  const deleteTab = useCallback(() => {
    if (!currentTab || focusTabs.tabs.length <= 1) return
    if (window.confirm(`删除分组「${currentTab.name}」？其中的卡片会移到相邻分组。`)) {
      dispatch({ type: "delete", id: currentTab.id })
    }
  }, [currentTab, dispatch, focusTabs.tabs.length])

  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center gap-2 max-w-full overflow-x-auto px-2 py-2 rounded-2xl bg-primary/1 shadow shadow-primary/20">
        {focusTabs.tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            title={tab.name}
            onClick={() => dispatch({ type: "select", id: tab.id })}
            className={$(
              "px-3 py-1 rounded-md text-sm whitespace-nowrap transition-all",
              tab.id === focusTabs.currentId ? "bg-primary/15 color-primary font-bold" : "op-70 hover:bg-primary/10",
            )}
          >
            {tab.name}
            <span className="ml-1 text-xs op-60">{tab.sources.length}</span>
          </button>
        ))}
        <span className="w-px h-5 bg-primary/20 mx-1 shrink-0" />
        <button type="button" title="新增分组" className="btn i-ph:plus-circle-duotone shrink-0" onClick={addTab} />
        <button type="button" title="重命名分组" className="btn i-ph:pencil-simple-duotone shrink-0" onClick={renameTab} />
        <button
          type="button"
          title="删除分组"
          className={$("btn i-ph:trash-duotone shrink-0", focusTabs.tabs.length <= 1 && "op-30 pointer-events-none")}
          onClick={deleteTab}
        />
      </div>
    </div>
  )
}
