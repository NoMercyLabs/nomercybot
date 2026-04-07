export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target }
  for (const key in source) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(
        (target[key] as Record<string, unknown>) ?? {},
        source[key] as Record<string, unknown>,
      ) as T[typeof key]
    } else if (source[key] !== undefined) {
      output[key] = source[key] as T[typeof key]
    }
  }
  return output
}
