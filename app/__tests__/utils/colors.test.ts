import { hexToHsl, hslToRgb, hexToRgbPalette, contrastColor } from '@/lib/theme/colors'

describe('hexToHsl', () => {
  it('converts pure red hex to hsl', () => {
    const { h, s, l } = hexToHsl('#ff0000')
    expect(h).toBeCloseTo(0, 0)
    expect(s).toBeCloseTo(1, 1)
    expect(l).toBeCloseTo(0.5, 1)
  })

  it('converts pure white to hsl', () => {
    const { h, s, l } = hexToHsl('#ffffff')
    expect(s).toBeCloseTo(0, 1)
    expect(l).toBeCloseTo(1, 1)
  })

  it('converts pure black to hsl', () => {
    const { h, s, l } = hexToHsl('#000000')
    expect(s).toBeCloseTo(0, 1)
    expect(l).toBeCloseTo(0, 1)
  })

  it('returns default fallback for invalid hex', () => {
    const { h, s, l } = hexToHsl('invalid')
    expect(h).toBe(270)
    expect(s).toBe(0.7)
    expect(l).toBe(0.5)
  })

  it('handles hex without leading #', () => {
    const { h, s, l } = hexToHsl('ff0000')
    expect(h).toBeCloseTo(0, 0)
    expect(l).toBeCloseTo(0.5, 1)
  })
})

describe('hslToRgb', () => {
  it('converts pure red hsl to rgb', () => {
    const { r, g, b } = hslToRgb(0, 1, 0.5)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('converts white hsl to rgb', () => {
    const { r, g, b } = hslToRgb(0, 0, 1)
    expect(r).toBe(255)
    expect(g).toBe(255)
    expect(b).toBe(255)
  })

  it('converts black hsl to rgb', () => {
    const { r, g, b } = hslToRgb(0, 0, 0)
    expect(r).toBe(0)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('returns integer rgb values', () => {
    const { r, g, b } = hslToRgb(120, 0.5, 0.5)
    expect(Number.isInteger(r)).toBe(true)
    expect(Number.isInteger(g)).toBe(true)
    expect(Number.isInteger(b)).toBe(true)
  })
})

describe('hexToRgbPalette', () => {
  it('generates 11 shades for a hex color', () => {
    const palette = hexToRgbPalette('#6366f1')
    const keys = Object.keys(palette)
    expect(keys).toHaveLength(11)
    expect(keys).toContain('50')
    expect(keys).toContain('500')
    expect(keys).toContain('950')
  })

  it('generates "r g b" format strings', () => {
    const palette = hexToRgbPalette('#6366f1')
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^\d+ \d+ \d+$/)
    }
  })

  it('generates lighter shade for 50 than for 950', () => {
    const palette = hexToRgbPalette('#6366f1')
    const [r50] = palette['50'].split(' ').map(Number)
    const [r950] = palette['950'].split(' ').map(Number)
    expect(r50).toBeGreaterThan(r950)
  })
})

describe('contrastColor', () => {
  it('returns black for light colors', () => {
    expect(contrastColor('#ffffff')).toBe('black')
    expect(contrastColor('#ffffcc')).toBe('black') // L > 0.5
  })

  it('returns white for dark colors', () => {
    expect(contrastColor('#000000')).toBe('white')
    expect(contrastColor('#1a1a2e')).toBe('white')
  })
})
