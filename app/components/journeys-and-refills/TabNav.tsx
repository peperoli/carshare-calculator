import { NavLink } from 'react-router'
import clsx from 'clsx'

export function TabNav({ spaceId }: { spaceId: number }) {
  return (
    <div className="flex mb-4">
      <NavLink
        to={`/spaces/${spaceId}/journeys/create`}
        className={({ isActive }) =>
          clsx(
            'p-2 border-b-4 font-bold',
            isActive
              ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-transparent text-gray-700 dark:text-gray-300'
          )
        }
      >
        Journey
      </NavLink>
      <NavLink
        to={`/spaces/${spaceId}/refills/create`}
        className={({ isActive }) =>
          clsx(
            'p-2 border-b-4 font-bold',
            isActive
              ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-transparent text-gray-700 dark:text-gray-300'
          )
        }
      >
        Refill
      </NavLink>
    </div>
  )
}
