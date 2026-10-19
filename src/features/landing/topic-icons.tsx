import {
  Banknote,
  Building2,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'

import type { TopicId } from '@/lib/constants'

export const TOPIC_ICONS: Record<TopicId, LucideIcon> = {
  manager_communication: MessageSquare,
  salary: Banknote,
  work_conditions: Building2,
  team: Users,
  learning: GraduationCap,
  ideas: Lightbulb,
  ethics: Scale,
  thanks: HeartHandshake,
  other: MoreHorizontal,
}
