import { useTranslation } from 'react-i18next'

import { TOPIC_IDS } from '@/lib/constants'

import { Reveal } from './Reveal'
import { TOPIC_ICONS } from './topic-icons'

export function TopicsSection() {
  const { t } = useTranslation()

  return (
    <section id="topics" className="scroll-mt-24 border-t border-[var(--color-border)]/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
            {t('landing.topics.title')}
          </h2>
          <p className="mt-3 max-w-xl text-base text-[var(--color-muted-foreground)] md:text-lg">
            {t('landing.topics.subtitle')}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="mt-12 columns-1 gap-x-12 sm:columns-2">
            {TOPIC_IDS.map((topic) => {
              const Icon = TOPIC_ICONS[topic]
              return (
                <li
                  key={topic}
                  className="break-inside-avoid border-b border-[var(--color-border)]/70 py-3.5"
                >
                  <span className="flex items-center gap-3 text-base text-[var(--color-foreground)]">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-accent)]">
                      <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                    </span>
                    {t(`topics.${topic}`)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
