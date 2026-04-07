/**
 * Semantic HTML wrappers — web implementation.
 * Renders real HTML elements (<nav>, <main>, <header>, etc.) on web.
 *
 * Callers pass React Native ViewProps (className, style, role, etc.).
 * We extract only the HTML-compatible props to avoid React DOM warnings.
 */
import React, { forwardRef, type CSSProperties, type ReactNode } from 'react'

interface SemanticProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties | CSSProperties[]
  id?: string
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-hidden'?: boolean
  testID?: string
  [key: string]: unknown
}

/** Extract only props that are safe for HTML elements */
function pickHtmlProps(props: SemanticProps) {
  const { children, className, style, id, role, testID, ...rest } = props
  // Flatten RN style arrays into a single object
  const flatStyle = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style

  const htmlProps: Record<string, unknown> = {}
  if (className) htmlProps.className = className
  if (flatStyle) htmlProps.style = flatStyle
  if (id) htmlProps.id = id
  if (role) htmlProps.role = role
  if (testID) htmlProps['data-testid'] = testID

  // Pass through aria-* and data-* props
  for (const [k, v] of Object.entries(rest)) {
    if (k.startsWith('aria-') || k.startsWith('data-')) {
      htmlProps[k] = v
    }
  }

  return { htmlProps, children }
}

function createSemanticElement(tag: string) {
  const Component = forwardRef<HTMLElement, SemanticProps>((props, ref) => {
    const { htmlProps, children } = pickHtmlProps(props)
    return React.createElement(tag, { ...htmlProps, ref }, children)
  })
  Component.displayName = tag.charAt(0).toUpperCase() + tag.slice(1)
  return Component
}

export const Nav = createSemanticElement('nav')
export const Main = createSemanticElement('main')
export const Header = createSemanticElement('header')
export const Footer = createSemanticElement('footer')
export const Section = createSemanticElement('section')
export const Article = createSemanticElement('article')
export const Aside = createSemanticElement('aside')
export const H1 = createSemanticElement('h1')
export const H2 = createSemanticElement('h2')
export const H3 = createSemanticElement('h3')
export const H4 = createSemanticElement('h4')
export const H5 = createSemanticElement('h5')
export const H6 = createSemanticElement('h6')

export type { SemanticProps as SemanticViewProps }
export type { SemanticProps as SemanticTextProps }
