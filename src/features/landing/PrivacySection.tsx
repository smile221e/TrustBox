import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Reveal } from './Reveal'

export function PrivacySection() {
  const { t } = useTranslation()

  return (
    <section
      id="privacy"
      className="scroll-mt-24 border-t border-[var(--color-border)]/60 bg-[linear-gradient(180deg,rgba(15,118,110,0.06),transparent_70%)] dark:bg-[linear-gradient(180deg,rgba(45,212,191,0.06),transparent_70%)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 md:flex-row md:items-start md:gap-16 md:px-6 md:py-28">
        <Reveal className="shrink-0">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.privacy.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-lg">
            {t('landing.privacy.body')}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
