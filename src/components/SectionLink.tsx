import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { handleSectionLinkClick } from '@/lib/scroll'
import { cn } from '@/lib/utils'

type SectionLinkProps = {
  sectionId: string
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'onClick' | 'children'>

/** In-page anchor that scrolls without fighting HashRouter. */
export function SectionLink({ sectionId, children, className, ...props }: SectionLinkProps) {
  return (
    <a
      href={`#${sectionId}`}
      className={cn(className)}
      onClick={(event) => handleSectionLinkClick(event, sectionId)}
      {...props}
    >
      {children}
    </a>
  )
}
