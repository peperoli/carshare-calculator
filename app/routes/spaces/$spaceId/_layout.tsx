import { createClient } from '~/utils/supabase.server'
import type { Route } from './+types/_layout'
import { JourneyItem } from '~/components/journeys-and-refills/JourneyItem'
import clsx from 'clsx'
import { RefillItem } from '~/components/journeys-and-refills/RefillItem'
import type { Tables } from 'database.types'
import * as Tabs from '@radix-ui/react-tabs'
import * as Dialog from '@radix-ui/react-dialog'
import { Link, Outlet, useOutlet } from 'react-router'

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = createClient(request)
  const spaceId = parseInt(params.spaceId)

  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select(
      `*,
      members(*),
      cars(*)`
    )
    .eq('id', spaceId)
    .order('name', { referencedTable: 'members' })
    .single()

  if (spaceError) {
    throw spaceError
  }

  type JourneyOrRefill = (
    | ({ type: 'journey' } & Tables<'journeys'>)
    | ({ type: 'refill' } & Tables<'refills'>)
  ) & {
    members: Tables<'members'>[]
    car: Tables<'cars'>
  }

  const { data: journeysAndRefills, error: journeysAndRefillsError } = await supabase
    .from('journeys_and_refills')
    .select('*')
    .eq('space_id', spaceId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<JourneyOrRefill[]>()

  if (journeysAndRefillsError) {
    throw journeysAndRefillsError
  }

  return { space, journeysAndRefills }
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { space, journeysAndRefills } = loaderData
  const costFormatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const memberBalances: { [member_id: number]: number } = {}
  const guestBalances: { [member_id: number]: number } = {}
  const outlet = useOutlet()
  const groupedJourneysAndRefills = groupByDate(journeysAndRefills)

  function groupByDate<T extends { date: string }>(items: T[]): { [date: string]: T[] } {
    return items.reduce((grouped, item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = []
      }
      grouped[item.date].push(item)
      return grouped
    }, {} as { [date: string]: T[] })
  }

  journeysAndRefills.forEach(item => {
    const journeyCost =
      item.type === 'journey'
        ? -1 * (item.fuel_cost / 100) * item.distance * item.car.consumption
        : item.cost

    const splitCost = item.members.length > 1 ? journeyCost / item.members.length : journeyCost

    item.members?.forEach(member => {
      if (member.is_guest) {
        if (guestBalances[member.id]) {
          guestBalances[member.id] += splitCost
        } else {
          guestBalances[member.id] = splitCost
        }
      } else {
        if (memberBalances[member.id]) {
          memberBalances[member.id] += splitCost
        } else {
          memberBalances[member.id] = splitCost
        }
      }
    })
  })

  const averageMemberBalance =
    Object.entries(memberBalances).reduce((acc, [_, balance]) => acc + balance, 0) /
    space.members.filter(member => !member.is_guest).length

  return (
    <>
      <main className="container">
        <h1 className="text-center">{space.name}</h1>
        <Tabs.Root defaultValue="journeysAndRefills" className="mt-6">
          <Tabs.List className="flex justify-center mb-6">
            <Tabs.Trigger
              value="journeysAndRefills"
              className={clsx(
                'p-2 text-center border-b-4 border-transparent font-bold text-gray-700 dark:text-gray-300',
                'data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:dark:border-gray-100  data-[state=active]:dark:text-gray-100 '
              )}
            >
              Journeys and Refills
            </Tabs.Trigger>
            <Tabs.Trigger
              value="balance"
              className={clsx(
                'p-2 text-center border-b-4 border-transparent font-bold text-gray-700 dark:text-gray-300',
                'data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:dark:border-gray-100  data-[state=active]:dark:text-gray-100 '
              )}
            >
              Balance
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="journeysAndRefills">
            <Link to={`/spaces/${space.id}/journeys/create`} className="btn btn-primary">
              Create journey or refill
            </Link>
            <ul className="grid gap-4 mt-6">
              {Object.entries(groupedJourneysAndRefills).map(([date, items]) => (
                <li key={date}>
                  <h2 className="sticky top-0 bg-gray-100 dark:bg-gray-900 py-2 text-sm mb-0 uppercase text-gray-700 dark:text-gray-300 tracking-wide">
                    {new Date(date).toLocaleDateString('de-CH', { dateStyle: 'full' })}
                  </h2>
                  <ul className="grid gap-2">
                    {items.map(item => {
                      if (item.type === 'journey') {
                        return <JourneyItem key={item.id} journey={item} />
                      } else if (item.type === 'refill') {
                        return <RefillItem key={item.id} refill={item} />
                      }
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </Tabs.Content>
          <Tabs.Content value="balance">
            <table className="w-full mb-6">
              <thead>
                <tr>
                  <th className="pb-2 text-left">Member</th>
                  <th className="pb-2 text-right">Balance</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {space.members.map(member => {
                  const balance = member.is_guest
                    ? guestBalances[member.id] ?? 0
                    : memberBalances[member.id] ?? 0
                  const deviation = balance - averageMemberBalance

                  return (
                    <tr key={member.id} className="ml-4">
                      <Cell>
                        {member.name} {member.is_guest && <span>(Guest)</span>}
                      </Cell>
                      <Cell
                        className={clsx(
                          'text-right',
                          Math.sign(deviation) === -1
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-green-700 dark:text-green-300'
                        )}
                      >
                        {!member.is_guest && <strong>{costFormatter.format(deviation)}</strong>}
                      </Cell>
                      <Cell className="text-right">{costFormatter.format(balance)}</Cell>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="pb-2 text-left">Car</th>
                  <th className="pb-2 text-left">Fuel</th>
                  <th className="pb-2 text-right">Consumption</th>
                </tr>
              </thead>
              <tbody>
                {space.cars.map(car => (
                  <tr key={car.id} className="ml-4">
                    <Cell>{car.name}</Cell>
                    <Cell>{car.fuel}</Cell>
                    <Cell className="text-right">{car.consumption} l/100km</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabs.Content>
        </Tabs.Root>
      </main>
      <Dialog.Root open={!!outlet}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur" />
          <Dialog.Content className="fixed inset-x-0 md:left-1/2 md:-translate-x-1/2 bottom-0 w-full max-w-xl top-auto py-8 px-4 md:p-8 bg-white dark:bg-gray-900 backdrop:bg-black/50">
            <Outlet />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={clsx('border-t border-gray-200 dark:border-gray-800 py-2', className)}>
      {children}
    </td>
  )
}
