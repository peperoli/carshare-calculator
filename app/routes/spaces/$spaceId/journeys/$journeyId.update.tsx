import { commitSession, getSession } from '~/sessions.server'
import type { Route } from './+types/$journeyId.update'
import { createClient } from '~/utils/supabase.server'
import { parseWithZod } from '@conform-to/zod'
import { journeySchema } from 'lib/schema/journey'
import { redirect } from 'react-router'
import { fetchSpace } from 'lib/fetchSpace'
import { JourneyForm } from '~/components/journeys-and-refills/JourneyForm'

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = createClient(request)
  const spaceId = parseInt(params.spaceId)
  const space = await fetchSpace(supabase, spaceId)
  const journeyId = parseInt(params.journeyId)

  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .select('*, j_journey_members(member_id)')
    .eq('id', journeyId)
    .single()

  if (journeyError) {
    throw journeyError
  }

  return { space, journey }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)
  const journeyId = parseInt(params.journeyId)

  try {
    const submission = parseWithZod(formData, { schema: journeySchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    const { space_id, member_ids, ...submissionValue } = submission.value

    const { error: updateJourneyError } = await supabase
      .from('journeys')
      .update(submissionValue)
      .eq('id', journeyId)

    if (updateJourneyError) {
      throw updateJourneyError
    }

    const { data: currentJourneyMembers, error: currentJourneyMembersError } = await supabase
      .from('j_journey_members')
      .select('*')
      .eq('journey_id', journeyId)

    if (currentJourneyMembersError) {
      throw currentJourneyMembersError
    }

    const memberIdsToDelete = currentJourneyMembers
      .filter(member => !member_ids.includes(member.member_id.toString()))
      .map(member => member.member_id)
    const memberIdsToInsert = member_ids.filter(
      memberId =>
        !currentJourneyMembers.some(journeyMember => journeyMember.member_id === parseInt(memberId))
    )

    const { error: deleteMembersError } = await supabase
      .from('j_journey_members')
      .delete()
      .eq('journey_id', journeyId)
      .in('member_id', memberIdsToDelete)

    if (deleteMembersError) {
      throw deleteMembersError
    }

    const { error: insertMembersError } = await supabase.from('j_journey_members').insert(
      memberIdsToInsert.map(memberId => ({
        journey_id: journeyId,
        member_id: parseInt(memberId),
      }))
    )

    if (insertMembersError) {
      throw insertMembersError
    }

    session.flash('success', 'Journey updated.')

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

export default function UpdateJourney({ loaderData }: Route.ComponentProps) {
  const { space, journey } = loaderData

  return (
    <JourneyForm
      space={space}
      action="update"
      defaultValue={{
        ...journey,
        member_ids: journey.j_journey_members.map(member => member.member_id.toString()),
      }}
    />
  )
}
