import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/$refillId.delete'
import { createClient } from '~/utils/supabase.server'
import { redirect } from 'react-router'

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const supabase = createClient(request)
  const spaceId = parseInt(params.spaceId)
  const refillId = parseInt(params.refillId)

  try {
    const { error } = await supabase.from('refills').delete().eq('id', refillId)

    if (error) {
      throw error
    }

    session.flash('success', 'Refill deleted.')

    return redirect(`/spaces/${spaceId}`, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      session.flash('error', error.message)
    }

    return new Response(null, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  }
}
