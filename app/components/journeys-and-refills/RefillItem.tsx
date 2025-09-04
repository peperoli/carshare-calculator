import type { Tables } from 'database.types'
import { Modal } from '../shared/Modal'
import { Form } from './Form'

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
      <Modal
        trigger={
          <div className="border border-gray-200 dark:border-gray-800 w-full p-4 rounded flex justify-between">
            <div className="text-left">
              <p>
                {refill.date} | <strong>Refill</strong>
              </p>
              <p>
                {refill.members.map(member => member.name).join(', ')} | {refill.car.name}
              </p>
            </div>
            <p className="text-right">
              <span className="text-green-800 dark:text-green-400">{costFormatter.format(refill.cost)}</span>
              <br />
              {refillAmount ? amountFormatter.format(refillAmount) : null} |{' '}
              {refill.fuel_cost ? costFormatter.format(refill.fuel_cost) : null}/l
            </p>
          </div>
        }
      >
        <Form
          action="update"
          ressourceType="refill"
          defaultValue={{ ...refill, member_id: refill.members[0].id.toString() }}
        />
      </Modal>
    </li>
  )
}
