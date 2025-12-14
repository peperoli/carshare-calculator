import { NavLink } from 'react-router'
import clsx from 'clsx'

export function TabNav({ spaceId }: { spaceId: number }) {
  return (
    <div className="flex mb-4">
      <NavLink
        to={`/spaces/${spaceId}/journeys/create`}
        className={({ isActive }) =>
          clsx(
            'p-2 border-b-4',
            isActive
              ? 'border-green-800 text-green-800 dark:border-green-400 dark:text-green-400'
              : 'border-transparent'
          )
        }
      >
        Journey
      </NavLink>
      <NavLink
        to={`/spaces/${spaceId}/refills/create`}
        className={({ isActive }) =>
          clsx(
            'p-2 border-b-4',
            isActive
              ? 'border-green-800 text-green-800 dark:border-green-400 dark:text-green-400'
              : 'border-transparent'
          )
        }
      >
        Refill
      </NavLink>
    </div>
  )
}
