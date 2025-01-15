import { createClient } from '~/utils/supabase.server'
import type { Route } from './+types/spaces.$id'
import { redirectDocument, type LoaderFunctionArgs } from 'react-router'
import { JourneyItem } from '~/components/journeys-and-refills/JourneyItem'
import { Modal } from '~/components/shared/Modal'
import { JourneyForm, journeySchema } from '~/components/journeys-and-refills/JourneyForm'
import { parseWithZod } from '@conform-to/zod'
import { commitSession, getSession } from '~/sessions.server'
import clsx from 'clsx'
import { RefillItem } from '~/components/journeys-and-refills/RefillItem'
import type { Tables } from 'database.types'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createClient(request)

  if (!params.id) {
    throw new Error('Missing space ID')
  }

  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select(
      `*,
      members(*),
      cars(*)`
    )
    .eq('id', parseInt(params.id))
    .single()

  if (spaceError) {
    throw spaceError
  }

  type JourneyOrRefill = (
    | ({ type: 'journey' } & Tables<'journeys'>)
    | ({ type: 'refill' } & Tables<'refills'>)
  ) & {
    members: Tables<'members'>[]
    car: Tables<'cars'>
  }

  const { data: journeysAndRefills, error: journeysAndRefillsError } = await supabase
    .from('journeys_and_refills')
    .select('*')
    .eq('space_id', parseInt(params.id))
    .order('date', { ascending: false })
    .returns<JourneyOrRefill[]>()

  if (journeysAndRefillsError) {
    throw journeysAndRefillsError
  }

  return { space, journeysAndRefills }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const formData = await request.formData()
  const supabase = createClient(request)

  try {
    const submission = parseWithZod(formData, { schema: journeySchema })

    if (submission.status !== 'success') {
      throw new Error('Invalid form submission')
    }

    switch (submission.value.intent) {
      case 'create': {
        const { date, name, distance, fuel_cost, member_ids, car_id } = submission.value

        const { data: journey, error: journeyError } = await supabase
          .from('journeys')
          .insert({ space_id: parseInt(params.id), date, name, distance, fuel_cost, car_id })
          .select()
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

        return redirectDocument(request.url, {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })
      }
      case 'update': {
        const { journey_id, date, name, distance, fuel_cost, member_ids, car_id } = submission.value

        if (!journey_id) {
          throw new Error('Missing journey ID')
        }

        const { error: updateJourneyError } = await supabase
          .from('journeys')
          .update({ date, name, distance, fuel_cost, car_id })
          .eq('id', journey_id)

        if (updateJourneyError) {
          throw updateJourneyError
        }

        const { data: currentJourneyMembers, error: currentJourneyMembersError } = await supabase
          .from('j_journey_members')
          .select('*')
          .eq('journey_id', journey_id)

        if (currentJourneyMembersError) {
          throw currentJourneyMembersError
        }

        const memberIdsToDelete = currentJourneyMembers
          .filter(member => !member_ids.includes(member.member_id.toString()))
          .map(member => member.member_id)
        const memberIdsToInsert = member_ids.filter(
          memberId =>
            !currentJourneyMembers.some(
              journeyMember => journeyMember.member_id === parseInt(memberId)
            )
        )

        const { error: deleteMembersError } = await supabase
          .from('j_journey_members')
          .delete()
          .eq('journey_id', journey_id)
          .in('member_id', memberIdsToDelete)

        if (deleteMembersError) {
          throw deleteMembersError
        }

        const { error: insertMembersError } = await supabase.from('j_journey_members').insert(
          memberIdsToInsert.map(memberId => ({
            journey_id,
            member_id: parseInt(memberId),
          }))
        )

        if (insertMembersError) {
          throw insertMembersError
        }

        session.flash('success', 'Journey updated.')

        return redirectDocument(request.url, {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })
      }
      case 'delete': {
        const { journey_id } = submission.value

        if (!journey_id) {
          throw new Error('Missing journey ID')
        }

        const { error } = await supabase.from('journeys').delete().eq('id', journey_id)

        if (error) {
          throw error
        }

        session.flash('success', 'Journey deleted.')

        return redirectDocument(request.url, {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })
      }
      default: {
        throw new Error('Unexpected action')
      }
    }
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

export default function Page({ loaderData }: Route.ComponentProps) {
  const { space, journeysAndRefills } = loaderData
  const memberBalances: { member_id: number; name: string; balance: number }[] = []
  const costFormatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  journeysAndRefills.forEach(item => {
    item.members?.forEach(member => {
      const memberBalance = memberBalances.find(balance => balance.member_id === member.id)
      let journeyCost =
        item.type === 'journey'
          ? -1 * (item.fuel_cost / 100) * item.distance * item.car.consumption
          : item.cost

      if (item.members.length > 1) {
        journeyCost /= item.members.length
      }

      if (memberBalance) {
        memberBalance.balance += journeyCost
      } else {
        memberBalances.push({
          member_id: member.id,
          name: member.name,
          balance: journeyCost,
        })
      }
    })
  })

  return (
    <main className="container">
      <h1>{space.name}</h1>
      <p>Members:</p>
      <ul>
        {memberBalances.map(member => (
          <li key={member.member_id} className="ml-4">
            {member.name}{' '}
            <span
              className={clsx(Math.sign(member.balance) === -1 ? 'text-red-800' : 'text-green-800')}
            >
              {costFormatter.format(member.balance)}
            </span>
          </li>
        ))}
      </ul>
      <p>Cars:</p>
      <ul>
        {space.cars.map(car => (
          <li key={car.id} className="ml-4">
            {car.name} ({car.fuel}, {car.consumption}L/100km)
          </li>
        ))}
      </ul>

      <h2 className="mt-6">Journeys and refills</h2>
      <Modal
        trigger={
          <div className="px-4 py-2 rounded-full bg-green-800 font-bold text-white">
            Create journey
          </div>
        }
      >
        <JourneyForm action="create" />
      </Modal>
      <ul className="grid gap-2 mt-6">
        {journeysAndRefills.map(item => {
          if (item.type === 'journey') {
            return <JourneyItem key={item.id} journey={item} />
          } else if (item.type === 'refill') {
            return <RefillItem key={item.id} refill={item} />
          }
        })}
      </ul>
      <pre>{JSON.stringify(journeysAndRefills, null, 2)}</pre>
    </main>
  )
}
