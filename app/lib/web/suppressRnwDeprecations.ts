// NativeWind v5 preview registers Tailwind shadow utilities into React Native's
// StyleSheet at startup using the old shadow* props (shadowColor, shadowOffset,
// shadowOpacity, shadowRadius). React Native for Web deprecates these in favour
// of boxShadow and emits a console.warn for every shadow style registered —
// regardless of whether the app ever renders a component that uses them.
//
// This module patches console.warn to suppress only that specific deprecation
// until NativeWind produces a boxShadow-based implementation for web.

if (typeof console !== 'undefined') {
  const originalWarn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      args[0].includes('"shadow*" style props are deprecated')
    ) {
      return
    }
    originalWarn(...args)
  }
}

export {}
