const KEY_PREFIX = 'discogs:'

/**
 * Retrieve a value from localStorage and deserialize it from JSON.
 * Returns `null` if the key does not exist or if parsing fails.
 */
export function lsGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Serialize `value` to JSON and write it to localStorage.
 * Silently ignores errors (e.g. private-browsing quota).
 */
export function lsSet<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage unavailable — fail silently.
  }
}

/**
 * Remove a single key from localStorage.
 */
export function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + key)
  } catch {
    // Fail silently.
  }
}

/**
 * Remove all localStorage keys that start with the shared prefix.
 * Pass an optional `subPrefix` to restrict removal to a sub-namespace.
 */
export function lsClear(subPrefix = ''): void {
  try {
    const fullPrefix = KEY_PREFIX + subPrefix
    const toRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k !== null && k.startsWith(fullPrefix)) {
        toRemove.push(k)
      }
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // Fail silently.
  }
}
