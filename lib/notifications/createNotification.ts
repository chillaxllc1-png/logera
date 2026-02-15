import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export async function createNotification({
  userId,
  type,
  title,
  body,
}: {
  userId: string
  type: 'failed' | 'refunds' | 'late'
  title: string
  body: string
}) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    is_read: false,
  })

  if (error) {
    console.error('createNotification failed', error)
    throw error
  }
}