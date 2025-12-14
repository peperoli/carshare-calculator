import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/create'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { journeySchema } from 'lib/schema/journey'
import { redirect } from 'react-router'
import { JourneyForm } from '~/components/journeys-and-refills/JourneyForm'
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
    const submission = parseWithZod(formData, { schema: journeySchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id, member_ids, ...submissionValue } = submission.value

    const { data: journey, error: journeyError } = await supabase
      .from('journeys')
      .insert({ ...submissionValue, space_id })
      .select('id')
      .single()

    if (journeyError) {
      throw journeyError
    }

    const { error: membersError } = await supabase
      .from('j_journey_members')
      .insert(
        member_ids.map(memberId => ({ journey_id: journey.id, member_id: parseInt(memberId) }))
      )

    if (membersError) {
      throw membersError
    }

    session.flash('success', 'Journey created.')

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

export default function CreateJourney({ loaderData }: Route.ComponentProps) {
  const { space } = loaderData

  return <JourneyForm space={space} action="create" />
}
