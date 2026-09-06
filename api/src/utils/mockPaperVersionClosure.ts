// 模考换版依赖闭包：确保组合卷及其引用的来源单项在同一批次拥有对应新版本。

export type MockPaperVersionClosureSet = {
  id: string
  modules: Array<{
    id: string
    sourceModuleId: string | null
  }>
}

type MockPaperVersionClosureResult<T> = {
  sets: T[]
  missingSourceModuleIds: string[]
}

// 从需要换版的套卷出发递归加载来源单项所属套卷，避免新组合卷指向旧版或丢失来源关系。
export async function expandMockPaperVersionClosure<T extends MockPaperVersionClosureSet>(
  initialSets: T[],
  loadSourceOwners: (sourceModuleIds: string[]) => Promise<T[]>,
): Promise<MockPaperVersionClosureResult<T>> {
  const setsById = new Map(initialSets.map((set) => [set.id, set]))

  while (true) {
    const includedModuleIds = new Set(
      [...setsById.values()].flatMap((set) => set.modules.map((module) => module.id)),
    )
    const missingSourceModuleIds = [...new Set(
      [...setsById.values()].flatMap((set) => (
        set.modules.flatMap((module) => (
          module.sourceModuleId && !includedModuleIds.has(module.sourceModuleId)
            ? [module.sourceModuleId]
            : []
        ))
      )),
    )]
    if (!missingSourceModuleIds.length) {
      return { sets: [...setsById.values()], missingSourceModuleIds: [] }
    }

    const sourceOwners = await loadSourceOwners(missingSourceModuleIds)
    for (const owner of sourceOwners) setsById.set(owner.id, owner)

    const resolvedModuleIds = new Set(
      [...setsById.values()].flatMap((set) => set.modules.map((module) => module.id)),
    )
    const unresolved = missingSourceModuleIds.filter((id) => !resolvedModuleIds.has(id))
    if (unresolved.length) {
      return { sets: [...setsById.values()], missingSourceModuleIds: unresolved }
    }
  }
}
