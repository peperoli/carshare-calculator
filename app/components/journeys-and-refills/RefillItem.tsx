import type { Tables } from 'database.types'
import { CarIcon, FuelIcon, UserIcon } from 'lucide-react'
import { Link } from 'react-router'

export function RefillItem({
  refill,
}: {
  refill: Omit<Tables<'refills'>, 'member_id'> & {
    members: Tables<'members'>[]
    car: Tables<'cars'>
  }
}) {
  const refillAmount = refill.fuel_cost ? refill.cost / refill.fuel_cost : null
  const costFormatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const amountFormatter = new Intl.NumberFormat('de-CH', {
    style: 'unit',
    maximumFractionDigits: 1,
    unit: 'liter',
  })

  return (
    <li>
      <Link
        to={`/spaces/${refill.space_id}/refills/${refill.id}/update`}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full p-4 rounded rounded-tl-2xl  flex justify-between gap-4"
      >
        <div className="rounded rounded-tl-2xl p-4 -ml-4 -my-4 flex-none bg-orange-600">
          <FuelIcon className="size-6 text-white" />
        </div>
        <div className="text-left">
          <p className="font-bold">Refill</p>
          <div className="flex items-center gap-2 ">
            <UserIcon className="size-4 flex-none" />
            <p className="line-clamp-1">{refill.members.map(member => member.name).join(', ')}</p>
          </div>
          <div className="flex items-center gap-2">
            <CarIcon className="size-4 flex-none" />
            <p className="line-clamp-1">{refill.car.name}</p>
          </div>
        </div>
        <p className="text-right ml-auto font-mono">
          <span className="font-bold text-orange-600 dark:text-orange-400">
            {costFormatter.format(refill.cost)}
          </span>
          <br />
          <span className="text-sm">
            {refillAmount ? amountFormatter.format(refillAmount) : null}
            <br />
            {refill.fuel_cost ? refill.fuel_cost : null}/l
          </span>
        </p>
      </Link>
    </li>
  )
}
