import { motion, useReducedMotion } from 'motion/react'

/** Dominant landing visual: sealed corporate trust box. */
export function TrustBoxVisual() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)]"
      aria-hidden
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 7, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 420 420" className="h-full w-full drop-shadow-[0_24px_48px_rgba(15,60,55,0.18)]">
        <defs>
          <linearGradient id="tb-body" x1="70" y1="90" x2="350" y2="360" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a6b62" />
            <stop offset="1" stopColor="#0d4a44" />
          </linearGradient>
          <linearGradient id="tb-lid" x1="90" y1="70" x2="330" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2a8f84" />
            <stop offset="1" stopColor="#145c55" />
          </linearGradient>
          <linearGradient id="tb-slot" x1="140" y1="150" x2="280" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#062e2a" />
            <stop offset="1" stopColor="#0a3f39" />
          </linearGradient>
          <filter id="tb-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft ground glow */}
        <ellipse cx="210" cy="360" rx="130" ry="22" fill="#0f766e" opacity="0.18" />

        {/* box body */}
        <path
          d="M78 150h264c14 0 26 12 26 26v156c0 22-18 40-40 40H92c-22 0-40-18-40-40V176c0-14 12-26 26-26Z"
          fill="url(#tb-body)"
        />
        <path
          d="M92 372h236c18 0 32-12 36-28H56c4 16 18 28 36 28Z"
          fill="#083832"
          opacity="0.45"
        />

        {/* lid */}
        <path
          d="M70 148c0-18 14-34 32-38l98-22c12-3 24-3 36 0l98 22c18 4 32 20 32 38v18H70v-18Z"
          fill="url(#tb-lid)"
        />
        <path d="M70 158h280v12H70z" fill="#0a3f39" opacity="0.35" />

        {/* mail slot */}
        <rect x="132" y="188" width="156" height="22" rx="6" fill="url(#tb-slot)" />
        <rect x="138" y="192" width="144" height="8" rx="3" fill="#ecfdf5" opacity="0.12" />

        {/* lock plate */}
        <rect x="186" y="248" width="48" height="58" rx="10" fill="#0a3f39" opacity="0.55" />
        <circle cx="210" cy="270" r="10" fill="#ecfdf5" opacity="0.9" />
        <path
          d="M210 278v16"
          stroke="#ecfdf5"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* paper tip entering slot */}
        <motion.path
          d="M198 176h24l8 14h-40l8-14Z"
          fill="#f4f7f5"
          initial={reduceMotion ? false : { y: -6, opacity: 0.7 }}
          animate={reduceMotion ? undefined : { y: [ -6, 0, -6 ], opacity: [0.7, 1, 0.7] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
          }
        />

        {/* accent ring */}
        <circle
          cx="210"
          cy="210"
          r="168"
          fill="none"
          stroke="#0f766e"
          strokeOpacity="0.12"
          strokeWidth="1.5"
          strokeDasharray="6 10"
        />
      </svg>
    </motion.div>
  )
}
