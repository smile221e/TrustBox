import { ArrowDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { SectionLink } from '@/components/SectionLink'
import { Button } from '@/components/ui/button'

import { TrustBoxVisual } from './TrustBoxVisual'

export function HeroSection() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  const fadeUp = (delay: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
        }

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_15%_10%,rgba(45,143,132,0.28),transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_20%,rgba(15,90,82,0.16),transparent_50%),linear-gradient(165deg,#e7f1ef_0%,#f3f6f5_42%,#dfeae7_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_15%_10%,rgba(45,212,191,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_20%,rgba(15,118,110,0.2),transparent_50%),linear-gradient(165deg,#071412_0%,#0b1a18_45%,#0a1614_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Cg fill=%22none%22 stroke=%22%230f766e%22 stroke-opacity=%220.09%22 stroke-width=%221%22%3E%3Cpath d=%22M0 40h80M40 0v80%22/%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-4.25rem)] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:px-6 md:py-16 lg:gap-16">
        <div className="flex flex-col items-start">
          <motion.p
            className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-6xl md:text-7xl"
            {...fadeUp(0.05)}
          >
            {t('app.name')}
          </motion.p>

          <motion.h1
            className="mt-5 max-w-xl text-2xl font-medium leading-snug tracking-tight text-[var(--color-foreground)] sm:text-3xl md:text-[2rem]"
            {...fadeUp(0.15)}
          >
            {t('landing.hero.headline')}
          </motion.h1>

          <motion.p
            className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-lg"
            {...fadeUp(0.25)}
          >
            {t('landing.hero.support')}
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap items-center gap-3" {...fadeUp(0.35)}>
            <Button asChild size="lg">
              <SectionLink sectionId="feedback">{t('landing.cta')}</SectionLink>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <SectionLink sectionId="how">
                {t('landing.hero.secondaryCta')}
                <ArrowDown />
              </SectionLink>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="flex justify-center md:justify-end"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, scale: 0.94 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
              })}
        >
          <TrustBoxVisual />
        </motion.div>
      </div>
    </section>
  )
}
