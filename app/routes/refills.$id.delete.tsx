import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/refills.$id.update'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { refillSchema } from 'lib/schema/refill'
import { redirect } from 'react-router'

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)
  const refillId = parseInt(params.id)

  try {
    const submission = parseWithZod(formData, { schema: refillSchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id } = submission.value

    const { error } = await supabase.from('refills').delete().eq('id', refillId)

    if (error) {
      throw error
    }

    session.flash('success', 'Refill deleted.')

    return redirect(`/spaces/${space_id}`, {
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
