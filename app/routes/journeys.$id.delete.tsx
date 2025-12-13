import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/journeys.$id.delete'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { journeySchema } from 'lib/schema/journey'
import { redirect } from 'react-router'

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)
  const journeyId = parseInt(params.id)

  try {
    const submission = parseWithZod(formData, { schema: journeySchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id } = submission.value

    const { error } = await supabase.from('journeys').delete().eq('id', journeyId)

    if (error) {
      throw error
    }

    session.flash('success', 'Journey deleted.')
    
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
