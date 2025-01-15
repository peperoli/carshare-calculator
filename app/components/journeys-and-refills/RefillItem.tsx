import type { Tables } from 'database.types'
import { Modal } from '../shared/Modal'

export function RefillItem({
  refill,
}: {
  refill: Tables<'refills'> & { members: Tables<'members'>[]; car: Tables<'cars'> }
}) {
  const refillAmount = refill.fuel_cost ? refill.cost / refill.fuel_cost : null
  const costFormatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <li>
      <Modal
        trigger={
          <div className="border border-gray-500 w-full p-4 rounded flex justify-between">
            <div className="text-left">
              <p>
                {refill.date} | <strong>Refill</strong>
              </p>
              <p>
                {refill.members.map(member => member.name).join(', ')} | {refill.car.name}
              </p>
            </div>
            <p className="text-right">
              <span className="text-green-800">{costFormatter.format(refill.cost)}</span>
              <br />
              {refillAmount} L | {refill.fuel_cost} CHF/L
            </p>
          </div>
        }
      >
        Todo: Refill form
      </Modal>
    </li>
  )
}
