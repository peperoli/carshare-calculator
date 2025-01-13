import { getCollectionProps, getSelectProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, useActionData } from 'react-router'
import { z } from 'zod'
import { TextInput } from '../forms/TextInput'
import type { Tables } from 'database.types'

export const journeySchema = z.object({
  date: z.string(),
  name: z.string().optional(),
  distance: z.number(),
  fuel_cost: z.number(),
  members: z.array(z.number()).min(1),
  car_id: z.number(),
})

export function JourneyForm({
  spaceId,
  members,
  cars,
}: {
  spaceId: number
  members: Tables<'members'>[]
  cars: Tables<'cars'>[]
}) {
  const lastResult = useActionData()
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,
    defaultValue: {
      date: new Date().toISOString().split('T')[0],
      fuel_cost: 1.75,
    },
    // Reuse the validation logic on the client
    onValidate({ formData }) {
      console.log(formData)
      return parseWithZod(formData, { schema: journeySchema })
    },
    // Validate the form on blur event triggered
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <Form
      method="post"
      id={form.id}
      onSubmit={form.onSubmit}
      action={`/spaces/${spaceId}`}
      noValidate
    >
      <TextInput type="date" field={fields.date} label="Date" />
      <TextInput field={fields.name} label="Name (optional)" placeholder="Shopping" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput type="number" field={fields.distance} label="Distance (km)" placeholder="25" />
        <TextInput
          type="number"
          field={fields.fuel_cost}
          label="Fuel cost (CHF)"
          placeholder="0,00"
        />
      </div>
      <fieldset>
        {getCollectionProps(fields.members, {
          type: 'checkbox',
          options: members.map(member => member.id.toString()),
        }).map(props => (
          <label key={props.id} htmlFor={props.id}>
            <input {...props} />
            <span>{members.find(member => member.id === parseInt(props.value))?.name}</span>
          </label>
        ))}
        <p className="text-sm text-red-700">{fields.members.errors}</p>
      </fieldset>
      <fieldset>
        <label className="font-bold text-sm">Car</label>
        <select
          {...getSelectProps(fields.car_id)}
          key={fields.car_id.key}
          className="block w-full p-2"
        >
          {cars.map(car => (
            <option key={car.id} value={car.id}>
              {car.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-red-700">{fields.car_id.errors}</p>
      </fieldset>
      <button type="submit" className="px-4 py-2 rounded-full bg-green-800 font-bold text-white">
        Submit
      </button>
    </Form>
  )
}
