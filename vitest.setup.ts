// Ensure localStorage is available in jsdom environment
if (typeof localStorage === 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: (() => {
      let store: Record<string, string> = {}
      return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        },
        length: Object.keys(store).length,
        key: (index: number) => Object.keys(store)[index] ?? null,
      }
    })(),
    writable: true,
  })
}
