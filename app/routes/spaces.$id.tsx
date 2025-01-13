import { createClient } from '~/utils/supabase.server'
import type { Route } from './+types/spaces.$id'
import type { LoaderFunctionArgs } from 'react-router'
import { JourneyItem } from '~/components/journeys/JourneyItem'
import { Modal } from '~/components/shared/Modal'
import { JourneyForm, journeySchema } from '~/components/journeys/JourneyForm'
import { parseWithZod } from '@conform-to/zod'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createClient(request)

  if (!params.id) {
    throw new Error('Missing space ID')
  }

  const { data: space, error } = await supabase
    .from('spaces')
    .select('*, members(*), cars(*), journeys(*, members(*), car:cars(*))')
    .eq('id', parseInt(params.id))
    .single()

  if (error) {
    throw error
  }

  return { space }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: journeySchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  // Save the journey to the database
  const supabase = createClient(request)
  const { date, name, distance, members, car_id } = submission.value

  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .insert({ space_id: parseInt(params.id), date, name, distance, car_id })
    .select()
    .single()

  if (journeyError) {
    throw journeyError
  }

  const { error: membersError } = await supabase
    .from('j_journey_members')
    .insert(members.map(member_id => ({ journey_id: journey.id, member_id })))

  if (membersError) {
    throw membersError
  }

  return journey
}

export default function Page({ loaderData, params }: Route.ComponentProps) {
  const { space } = loaderData
  return (
    <main className="container">
      <h1>{space.name}</h1>
      <p>Members: {space.members.map(member => member.name).join(', ')}</p>
      <p>
        Cars:{' '}
        {space.cars.map(car => `${car.name} (${car.fuel}, ${car.consumption}L/100km)`).join(', ')}
      </p>
      <h2 className="mt-6">Journeys</h2>
      <Modal
        trigger={
          <button className="px-4 py-2 rounded-full bg-green-800 font-bold text-white">
            Add journey
          </button>
        }
      >
        <h2>Add journey</h2>
        <JourneyForm spaceId={parseInt(params.id)} members={space.members} cars={space.cars} />
      </Modal>
      <ul className="grid gap-2 mt-6">
        {space.journeys.map(journey => (
          <JourneyItem key={journey.id} journey={journey} />
        ))}
      </ul>
    </main>
  )
}
