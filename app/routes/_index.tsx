import { Link, type LoaderFunctionArgs } from 'react-router'
import type { Route } from './+types/_index'
import { createClient } from '~/utils/supabase.server'

export function meta() {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request)

  const { data: spaces, error } = await supabase.from('spaces').select('id, name')

  if (error) {
    throw error
  }

  return { spaces }
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { spaces } = loaderData
  return (
    <main className="container">
      <h1>Carshare Calculator</h1>
      <p>Choose your space:</p>
      <ul>
        {spaces.map(todo => (
          <li key={todo.id} className="p-4 rounded border border-slate-500">
            <Link to="/spaces/1">{todo.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
