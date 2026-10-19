import { FeedbackSection } from '@/features/feedback/FeedbackSection'
import { HeroSection } from '@/features/landing/HeroSection'
import { HowItWorksSection } from '@/features/landing/HowItWorksSection'
import { PrivacySection } from '@/features/landing/PrivacySection'
import { TopicsSection } from '@/features/landing/TopicsSection'

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <PrivacySection />
      <TopicsSection />
      <FeedbackSection />
    </>
  )
}
