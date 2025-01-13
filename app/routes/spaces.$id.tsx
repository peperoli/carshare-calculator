import { createClient } from '~/utils/supabase.server'
import type { Route } from './+types/spaces.$id'
import type { LoaderFunctionArgs } from 'react-router'

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

export default function Page({ loaderData }: Route.ComponentProps) {
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
      <button className="px-4 py-2 rounded-full bg-green-800 font-bold text-white">
        Add journey
      </button>
      <ul>
        {space.journeys.map(journey => (
          <li key={journey.id}>
            <a href={`/journeys/${journey.id}`}>
              {journey.date} | {journey.name} | {journey.distance} km |{' '}
              {journey.members.map(member => member.name).join(', ')} | {journey.car.name} |{' '}
              {Math.round(journey.fuel_cost * journey.distance * journey.car.consumption) / 100} CHF
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
