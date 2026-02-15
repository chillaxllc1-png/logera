import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export async function hasUnreadAlerts(userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('hasUnreadAlerts error', error)
    return false
  }

  return (count ?? 0) > 0
}