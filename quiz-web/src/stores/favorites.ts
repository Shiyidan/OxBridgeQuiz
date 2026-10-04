// 收藏状态由同一用户的答题、错题与收藏夹共享，切换账号立即清空缓存。
import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import {
  getFavoriteStates,
  saveFavorite,
  removeFavorite,
  organizeFavorites,
  type FavoriteState,
} from '@/api/favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const auth = useAuthStore()
  const states = reactive<Record<string, FavoriteState | null>>({})
  const busy = reactive<Record<string, boolean>>({})
  const revision = ref(0)
  let generation = 0
  const versions = new Map<string, number>()
  const pending = new Map<string, Promise<void>>()
  const channel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('quiz-favorites')
  watch(
    () => auth.user?.id,
    () => {
      generation++
      Object.keys(states).forEach((id) => delete states[id])
      Object.keys(busy).forEach((id) => delete busy[id])
      pending.clear()
      versions.clear()
      revision.value++
    },
  )

  // 同一账号在其他标签页整理收藏后重新读状态，保持答题星标与收藏夹一致。
  async function refreshVisibleStates() {
    if (!auth.user) return
    try {
      await load(Object.keys(states), true)
      revision.value++
    } catch {
      /* 下一次切题或聚焦仍可重试。 */
    }
  }
  channel?.addEventListener('message', (event: MessageEvent<{ userId?: string }>) => {
    if (event.data?.userId === auth.user?.id) void refreshVisibleStates()
  })
  window.addEventListener('focus', refreshVisibleStates)

  // 复用并发状态请求，较早的查询不能覆盖后续收藏操作。
  async function load(ids: string[], force = false): Promise<void> {
    if (!auth.user) return
    const version = generation
    const unique = [...new Set(ids)].filter(Boolean)
    const missing = unique.filter((id) => !pending.has(id) && (force || states[id] === undefined))
    for (let start = 0; start < missing.length; start += 100) {
      const chunk = missing.slice(start, start + 100)
      const requestedVersions = new Map(chunk.map((id) => [id, versions.get(id) || 0]))
      const request = getFavoriteStates(chunk)
        .then((rows) => {
          if (version !== generation) return
          const map = new Map(rows.map((item) => [item.questionId, item]))
          chunk.forEach((id) => {
            if (!busy[id] && requestedVersions.get(id) === (versions.get(id) || 0))
              states[id] = map.get(id) ?? null
          })
        })
        .finally(() => {
          if (version === generation) chunk.forEach((id) => pending.delete(id))
        })
      chunk.forEach((id) => pending.set(id, request))
    }
    await Promise.all(unique.map((id) => pending.get(id)))
  }

  // 以服务端成功结果更新星标，失败时保留原状态并允许重试。
  async function setFavorite(id: string, selected: boolean): Promise<boolean> {
    if (!auth.user || busy[id]) return false
    const version = generation
    busy[id] = true
    versions.set(id, (versions.get(id) || 0) + 1)
    try {
      const result = selected ? await saveFavorite(id) : await removeFavorite(id)
      if (version !== generation) return false
      states[id] = result
      revision.value++
      channel?.postMessage({ userId: auth.user.id })
      return true
    } finally {
      if (version === generation) busy[id] = false
    }
  }

  // 批量整理与单题星标共享禁用状态，防止同一题同时取消和分类。
  async function organize(
    examType: string,
    ids: string[],
    action: 'move' | 'remove',
    categoryId: string | null = null,
  ) {
    if (ids.some((id) => busy[id])) return false
    const version = generation
    ids.forEach((id) => {
      busy[id] = true
    })
    ids.forEach((id) => versions.set(id, (versions.get(id) || 0) + 1))
    try {
      await organizeFavorites(examType, ids, action, categoryId)
      if (version !== generation) return false
      ids.forEach((id) => {
        states[id] = action === 'remove' ? null : { questionId: id, categoryId }
      })
      revision.value++
      channel?.postMessage({ userId: auth.user?.id })
      return true
    } finally {
      if (version === generation)
        ids.forEach((id) => {
          busy[id] = false
        })
    }
  }
  return { states, busy, revision, load, setFavorite, organize }
})
