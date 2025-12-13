import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/refills.create'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { refillSchema } from 'lib/schema/refill'
import { redirect } from 'react-router'

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)

  try {
    const submission = parseWithZod(formData, { schema: refillSchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id, member_id, ...submissionValue } = submission.value

    const { error: refillError } = await supabase
      .from('refills')
      .insert({
        space_id,
        ...submissionValue,
        member_id: parseInt(member_id),
      })
      .select()
      .single()

    if (refillError) {
      throw refillError
    }

    session.flash('success', 'Refill created.')

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
