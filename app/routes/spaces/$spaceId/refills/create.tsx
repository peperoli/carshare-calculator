import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/create'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { refillSchema } from 'lib/schema/refill'
import { redirect } from 'react-router'
import { RefillForm } from '~/components/journeys-and-refills/RefillForm'
import { fetchSpace } from 'lib/fetchSpace'

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = createClient(request)
  const spaceId = parseInt(params.spaceId)
  const space = await fetchSpace(supabase, spaceId)

  return { space }
}

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

export default function CreateRefill({ loaderData }: Route.ComponentProps) {
  const { space } = loaderData

  return <RefillForm space={space} action="create" />
}
