// React-native-web injects styles into <style id="react-native-stylesheet">
// using insertRule(). These rules are *unlayered*, which means they override
// all CSS @layer rules — including Tailwind v4's @layer utilities.
//
// Fix: intercept the stylesheet's insertRule() to wrap every rule inside
// @layer rnw { ... }. Combined with the `@layer rnw;` declaration at the top
// of global.css, this gives RNW base styles the lowest cascade priority.

if (typeof document !== 'undefined') {
  const el = document.getElementById('react-native-stylesheet')

  if (el instanceof HTMLStyleElement && el.sheet) {
    const sheet = el.sheet

    // Wrap rules that were already inserted before this module ran
    const existing: string[] = []
    while (sheet.cssRules.length > 0) {
      existing.push(sheet.cssRules[0].cssText)
      sheet.deleteRule(0)
    }
    for (const rule of existing) {
      sheet.insertRule(`@layer rnw { ${rule} }`, sheet.cssRules.length)
    }

    // Intercept future insertRule calls
    const original = sheet.insertRule.bind(sheet)
    sheet.insertRule = (rule: string, index?: number) => {
      if (rule.trimStart().startsWith('@layer')) {
        return original(rule, index)
      }
      return original(`@layer rnw { ${rule} }`, index)
    }
  }
}

export {} // ensure this is treated as a module
