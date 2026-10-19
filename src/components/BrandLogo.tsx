import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  alt?: string
}

/** Original 221e mark — no brightness/invert filters (they hid it in dark mode). */
export function BrandLogo({ className, alt = '221e' }: BrandLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md',
        // Keep a light plate in dark theme so the charcoal wordmark stays readable
        'dark:bg-white dark:px-2 dark:py-1',
        className,
      )}
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/logo-221e.png`}
        alt={alt}
        className="h-7 w-auto select-none object-contain object-left mix-blend-multiply sm:h-8 dark:mix-blend-normal"
        decoding="async"
      />
    </span>
  )
}
