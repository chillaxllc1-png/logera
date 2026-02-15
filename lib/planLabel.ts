// lib/planLabel.ts
import type { PlanKey } from '@/lib/features'

export function formatPlanLabel(plan: PlanKey | null | undefined) {
  if (!plan) return '—'

  switch (plan) {
    case 'starter':
      return 'Starter'
    case 'growth':
      return 'Growth'
    case 'pro':
      return 'Pro'
    default:
      return plan
  }
}