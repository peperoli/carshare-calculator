import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'database.types'

export async function fetchSpace(supabase: SupabaseClient<Database>, spaceId: number) {
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select(
      `*,
      members(*),
      cars(*)`
    )
    .eq('id', spaceId)
    .order('name', { referencedTable: 'members' })
    .single()

  if (spaceError) {
    throw spaceError
  }

  return space
}
