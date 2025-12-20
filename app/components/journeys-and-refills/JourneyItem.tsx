import type { Tables } from 'database.types'
import { Link } from 'react-router'
import { CarIcon, RouteIcon, UserIcon } from 'lucide-react'

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
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full p-4 rounded rounded-tl-2xl flex gap-4"
      >
        <div className="rounded rounded-tl-2xl p-4 -ml-4 -my-4 flex-none bg-teal-700">
          <RouteIcon className="size-6 text-white" />
        </div>
        <div>
          <div className="flex gap-3">
            <p className="font-bold line-clamp-2">{journey.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 flex-none" />
            <p className="line-clamp-1">{journey.members.map(member => member.name).join(', ')}</p>
          </div>
          <div className="flex items-center gap-2 line-clamp-1">
            <CarIcon className="size-4 flex-none" />
            <p className="line-clamp-1">{journey.car.name}</p>
          </div>
        </div>
        <p className="text-right ml-auto font-mono">
          <span className="font-bold text-teal-700 dark:text-teal-400">
            {costFormatter.format(journeyCost)}
          </span>
          <br />
          {distanceFormatter.format(journey.distance)}
          <br />
          {journey.fuel_cost}/l
        </p>
      </Link>
    </li>
  )
}
