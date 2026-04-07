/**
 * Native intent handler for expo-router v5.
 *
 * This file is automatically picked up by expo-router to rewrite incoming
 * deep-link URLs before the router resolves a screen.
 *
 * Handles: `nomercybot://callback?...`  →  `/callback?...`
 * (The `/callback` route then redirects to `/(auth)/callback`.)
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string
  initial: boolean
}): string {
  // Rewrite bare `callback` to `/callback` (no change needed — already handled
  // by the file-based route `app/callback.tsx`).  This hook is here as an
  // explicit escape hatch and for documentation purposes.
  try {
    const url = new URL(path, 'nomercybot://')
    const pathname = url.pathname.replace(/^\/+/, '')

    // If the OS passes `(auth)/callback` (with group segment) normalize it
    // to the flat `/callback` which expo-router can also find.
    if (pathname === '(auth)/callback') {
      return `/callback${url.search}`
    }

    return path
  } catch {
    return path
  }
}
