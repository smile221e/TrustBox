import { useTranslation } from 'react-i18next'

import { Reveal } from './Reveal'

const STEPS = ['choose', 'write', 'send'] as const

export function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section id="how" className="scroll-mt-24 border-t border-[var(--color-border)]/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.how.title')}
          </h2>
          <p className="mt-3 max-w-xl text-base text-[var(--color-muted-foreground)] md:text-lg">
            {t('landing.how.subtitle')}
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step} className="relative">
              <Reveal delay={0.08 * index}>
                <span className="font-[family-name:var(--font-display)] text-5xl font-semibold tabular-nums text-[var(--color-accent)]/35">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {t(`landing.how.steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
                  {t(`landing.how.steps.${step}.body`)}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
