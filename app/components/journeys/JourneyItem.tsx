import type { Tables } from 'database.types'

export function JourneyItem({
  journey,
}: {
  journey: Tables<'journeys'> & { members: Tables<'members'>[]; car: Tables<'cars'> }
}) {
  return (
    <li className="border border-gray-100 p-4">
      <a href={`/journeys/${journey.id}`}>
        {journey.date} | {journey.name} | {journey.distance} km |{' '}
        {journey.members.map(member => member.name).join(', ')} | {journey.car.name} |{' '}
        {Math.round(journey.fuel_cost * journey.distance * journey.car.consumption) / 100} CHF
      </a>
    </li>
  )
}
