import { useTranslation } from 'react-i18next'

import { Reveal } from '@/features/landing/Reveal'

import { FeedbackForm } from './FeedbackForm'

export function FeedbackSection() {
  const { t } = useTranslation()

  return (
    <section id="feedback" className="scroll-mt-24 border-t border-[var(--color-border)]/60">
      <div className="w-full px-4 py-20 md:px-6 md:py-28 lg:px-10">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.feedback.title')}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[var(--color-muted-foreground)] md:text-lg">
            {t('landing.feedback.subtitle')}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-10 w-full">
          <FeedbackForm />
        </Reveal>
      </div>
    </section>
  )
}
