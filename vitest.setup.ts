// vitest 4 + jsdom 29 + Node 26 provide no window.localStorage in the test
// environment (Node's experimental localStorage global requires
// --localstorage-file and resolves to undefined). Minimal Storage shim,
// installed only when the environment lacks one. Tests only — the app runs
// against the real browser localStorage.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

if (typeof window !== 'undefined' && window.localStorage === undefined) {
  Object.defineProperty(window, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  })
}
