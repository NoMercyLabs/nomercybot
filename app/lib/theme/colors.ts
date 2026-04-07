export function hexToRgbPalette(hex: string): Record<string, string> {
  const { h, s, l } = hexToHsl(hex)

  const shades: Record<string, number> = {
    '50': 97, '100': 94, '200': 86, '300': 76, '400': 64,
    '500': 50, '600': 42, '700': 34, '800': 26, '900': 20, '950': 14,
  }

  const palette: Record<string, string> = {}
  for (const [shade, targetL] of Object.entries(shades)) {
    const adjustedS = s * (targetL > 50 ? 0.6 + (targetL / 100) * 0.4 : 1)
    const { r, g, b } = hslToRgb(h, adjustedS, targetL / 100)
    palette[shade] = `${r} ${g} ${b}`
  }

  return palette
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 270, s: 0.7, l: 0.5 }

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s, l }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const hNorm = h / 360
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, hNorm + 1 / 3)
    g = hue2rgb(p, q, hNorm)
    b = hue2rgb(p, q, hNorm - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function contrastColor(hex: string): 'white' | 'black' {
  const { l } = hexToHsl(hex)
  return l > 0.5 ? 'black' : 'white'
}
