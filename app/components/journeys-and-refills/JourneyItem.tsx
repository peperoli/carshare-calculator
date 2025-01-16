import type { Tables } from 'database.types'
import { Modal } from '../shared/Modal'
import { Form } from './Form'

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
      <Modal
        trigger={
          <div className="border border-gray-200 dark:border-gray-800 w-full p-4 rounded flex justify-between">
            <div className="text-left">
              <p>
                {journey.date} | <i>{journey.name}</i>
              </p>
              <p>
                {journey.members.map(member => member.name).join(', ')} | {journey.car.name}
              </p>
            </div>
            <p className="text-right">
              <span className="text-red-800">{costFormatter.format(journeyCost)}</span>
              <br />
              {distanceFormatter.format(journey.distance)} | {costFormatter.format(journey.fuel_cost)}/l
            </p>
          </div>
        }
      >
        <Form
          action="update"
          ressourceType="journey"
          defaultValue={{
            ...journey,
            member_ids: journey.members.map(member => member.id.toString()),
          }}
        />
      </Modal>
    </li>
  )
}
