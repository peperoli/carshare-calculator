import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/$refillId.update'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { refillSchema } from 'lib/schema/refill'
import { redirect } from 'react-router'
import { fetchSpace } from 'lib/fetchSpace'
import { RefillForm } from '~/components/journeys-and-refills/RefillForm'

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = createClient(request)
  const spaceId = parseInt(params.spaceId)
  const space = await fetchSpace(supabase, spaceId)
  const refillId = parseInt(params.refillId)

  const { data: refill, error: refillError } = await supabase
    .from('refills')
    .select('*')
    .eq('id', refillId)
    .single()

  if (refillError) {
    throw refillError
  }

  return { space, refill }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)
  const refillId = parseInt(params.refillId)

  try {
    const submission = parseWithZod(formData, { schema: refillSchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id, member_id, ...submissionValue } = submission.value

    const { error: updateRefillError } = await supabase
      .from('refills')
      .update({ ...submissionValue, member_id: parseInt(member_id) })
      .eq('id', refillId)

    if (updateRefillError) {
      throw updateRefillError
    }

    session.flash('success', 'Refill updated.')

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

export default function UpdateRefill({ loaderData }: Route.ComponentProps) {
  const { space, refill } = loaderData

  return (
    <RefillForm
      space={space}
      action="update"
      defaultValue={{ ...refill, member_id: refill.member_id.toString() }}
    />
  )
}
