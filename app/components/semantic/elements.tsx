/**
 * Semantic HTML wrappers — native fallback.
 * These render plain <View> / <Text> on iOS and Android.
 * See elements.web.tsx for the web version that renders real HTML elements.
 */
import { View, Text, type ViewProps, type TextProps } from 'react-native'

export const Nav = View
export const Main = View
export const Header = View
export const Footer = View
export const Section = View
export const Article = View
export const Aside = View

export const H1 = Text
export const H2 = Text
export const H3 = Text
export const H4 = Text
export const H5 = Text
export const H6 = Text

export type { ViewProps as SemanticViewProps, TextProps as SemanticTextProps }
