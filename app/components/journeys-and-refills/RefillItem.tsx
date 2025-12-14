import type { Tables } from 'database.types'
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
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full p-4 rounded flex justify-between"
      >
        <div className="text-left">
          <p>
            {refill.date} | <strong>Refill</strong>
          </p>
          <p>
            {refill.members.map(member => member.name).join(', ')} | {refill.car.name}
          </p>
        </div>
        <p className="text-right">
          <span className="text-green-800 dark:text-green-400">
            {costFormatter.format(refill.cost)}
          </span>
          <br />
          {refillAmount ? amountFormatter.format(refillAmount) : null} |{' '}
          {refill.fuel_cost ? costFormatter.format(refill.fuel_cost) : null}/l
        </p>
      </Link>
    </li>
  )
}
