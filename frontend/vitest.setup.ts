import "@testing-library/jest-dom"

// Provide a working localStorage for all test files.
// Must live here (not in individual test files) because ES module imports
// are hoisted — the Zustand store reads localStorage at module-init time.
const _store: Record<string, string> = {}
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => _store[key] ?? null,
    setItem: (key: string, v: string) => { _store[key] = v },
    removeItem: (key: string) => { delete _store[key] },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]) },
  },
})
