import type { MouseEvent } from 'react'

/**
 * HashRouter owns `window.location.hash` for routes (`#/`, `#/admin`).
 * Native `href="#section"` would replace the route hash and break navigation.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  })
}

export function handleSectionLinkClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault()
  scrollToSection(id)
}
