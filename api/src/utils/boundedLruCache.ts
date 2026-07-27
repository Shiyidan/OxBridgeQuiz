// 为进程内结果缓存提供固定容量的 LRU 淘汰，避免服务长期运行时无界增长。

export class BoundedLruCache<K, V> {
  private readonly entries = new Map<K, V>()

  constructor(private readonly maxEntries: number) {
    if (!Number.isInteger(maxEntries) || maxEntries <= 0) {
      throw new Error('BoundedLruCache maxEntries must be a positive integer')
    }
  }

  // 缓存命中时刷新插入顺序，使后续超限淘汰最久未使用的条目。
  get(key: K): V | undefined {
    if (!this.entries.has(key)) return undefined

    const value = this.entries.get(key) as V
    this.entries.delete(key)
    this.entries.set(key, value)
    return value
  }

  // 写入后仅保留固定数量的最近使用条目，覆盖同一键不会额外占用容量。
  set(key: K, value: V): void {
    this.entries.delete(key)
    this.entries.set(key, value)

    if (this.entries.size <= this.maxEntries) return

    const oldestEntry = this.entries.keys().next()
    if (!oldestEntry.done) this.entries.delete(oldestEntry.value)
  }

  get size(): number {
    return this.entries.size
  }
}
