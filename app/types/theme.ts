export type AccentShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950'

export interface AccentPalette {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface ThemeConfig {
  isDark: boolean
  accentHex: string
  accentOverride: string | null
  palette: AccentPalette
}

export interface ColorPalette {
  [shade: string]: string
}
