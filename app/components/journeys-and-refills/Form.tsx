import clsx from 'clsx'
import { JourneyForm } from './JourneyForm'
import { RefillForm } from './RefillForm'
import { useState } from 'react'
import type { Tables } from 'database.types'

export function Form({
  spaceId,
  action,
  ...props
}: { spaceId: number } & (
  | { action: 'create'; ressourceType?: undefined; defaultValue?: undefined }
  | ({
      action: 'update'
    } & (
      | {
          ressourceType: 'journey'
          defaultValue: Tables<'journeys'> & { member_ids: string[] }
        }
      | {
          ressourceType: 'refill'
          defaultValue: Omit<Tables<'refills'>, 'member_id'> & { member_id: string }
        }
    ))
)) {
  const [ressourceType, setRessourceType] = useState(
    action === 'update' ? props.ressourceType : 'journey'
  )

  return (
    <div className="grid gap-4">
      {action === 'create' && (
        <div className="flex">
          <button
            type="button"
            onClick={() => setRessourceType('journey')}
            className={clsx(
              'p-2 border-b-4',
              ressourceType === 'journey'
                ? 'border-green-800 text-green-800 dark:border-green-400 dark:text-green-400'
                : 'border-transparent'
            )}
          >
            Journey
          </button>
          <button
            type="button"
            onClick={() => setRessourceType('refill')}
            className={clsx(
              'p-2 border-b-4',
              ressourceType === 'refill'
                ? 'border-green-800 text-green-800 dark:border-green-400 dark:text-green-400'
                : 'border-transparent'
            )}
          >
            Refill
          </button>
        </div>
      )}
      {ressourceType === 'journey' ? (
        <JourneyForm spaceId={spaceId} action={action} defaultValue={props.defaultValue} />
      ) : (
        <RefillForm spaceId={spaceId} action={action} defaultValue={props.defaultValue} />
      )}
    </div>
  )
}
