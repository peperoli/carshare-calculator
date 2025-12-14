import type { Tables } from 'database.types'
import { Link } from 'react-router'

export function JourneyItem({
  journey,
}: {
  journey: Tables<'journeys'> & { members: Tables<'members'>[]; car: Tables<'cars'> }
}) {
  const journeyCost = (journey.fuel_cost / 100) * journey.distance * journey.car.consumption
  const costFormatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const distanceFormatter = new Intl.NumberFormat('de-CH', {
    style: 'unit',
    unit: 'kilometer',
  })

  return (
    <li>
      <Link
        to={`/spaces/${journey.space_id}/journeys/${journey.id}/update`}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full p-4 rounded flex justify-between"
      >
        <div className="text-left">
          <p>
            {journey.date} | <i>{journey.name}</i>
          </p>
          <p>
            {journey.members.map(member => member.name).join(', ')} | {journey.car.name}
          </p>
        </div>
        <p className="text-right">
          <span className="text-red-800 dark:text-red-400">
            {costFormatter.format(journeyCost)}
          </span>
          <br />
          {distanceFormatter.format(journey.distance)} | {costFormatter.format(journey.fuel_cost)}/l
        </p>
      </Link>
    </li>
  )
}
