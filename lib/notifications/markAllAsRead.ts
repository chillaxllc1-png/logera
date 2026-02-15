import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export async function markAllAsRead(userId: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('markAllAsRead error', error)
  }
}

// ✅ わかりやすい名前でも呼べるように “別名 export”
export const markAllNotificationsAsRead = markAllAsRead