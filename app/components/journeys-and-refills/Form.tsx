import { getCollectionProps, getSelectProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form as ReactRouterForm, useActionData, useLoaderData } from 'react-router'
import { z } from 'zod'
import { TextInput } from '../forms/TextInput'
import type { Tables } from 'database.types'
import type { loader } from '~/routes/spaces.$id'
import { useState } from 'react'
import clsx from 'clsx'

export const journeySchema = z.object({
  journey_id: z.number().optional(),
  date: z.string(),
  name: z.string().optional(),
  distance: z.number().int().min(1),
  fuel_cost: z.number().min(0.01),
  member_ids: z.array(z.string()).min(1),
  car_id: z.number(),
  intent: z.enum(['create', 'update', 'delete']),
})

export const refillSchema = z.object({
  refill_id: z.number().optional(),
  date: z.string(),
  cost: z.number().min(1),
  fuel_cost: z.number().min(0.01),
  member_id: z.string(),
  car_id: z.number(),
  intent: z.enum(['create', 'update', 'delete']),
})

export function Form({
  action,
  defaultValue,
}: {
  action: 'create' | 'update'
  defaultValue?: Tables<'journeys'> & { member_ids: string[] }
}) {
  const { space } = useLoaderData<typeof loader>()
  const lastResult = useActionData()
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,
    defaultValue:
      action === 'update'
        ? defaultValue
        : {
            date: new Date().toISOString().split('T')[0],
            fuel_cost: 1.75,
          },
    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: formType === 'journey' ? journeySchema : refillSchema,
      })
    },
    // Validate the form on blur event triggered
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  const [formType, setFormType] = useState<'journey' | 'refill'>('journey')

  return (
    <ReactRouterForm
      method="post"
      id={form.id}
      onSubmit={form.onSubmit}
      action={`/spaces/${space.id}`}
      noValidate
      className="grid gap-4"
    >
      <h2>{action === 'update' ? 'Update journey' : 'Create journey'}</h2>
      <div>
        <button
          type="button"
          onClick={() => setFormType('journey')}
          className={clsx(
            'p-2 border-b-4',
            formType === 'journey' ? 'border-green-800' : 'border-transparent'
          )}
        >
          Journey
        </button>
        <button
          type="button"
          onClick={() => setFormType('refill')}
          className={clsx(
            'p-2 border-b-4',
            formType === 'refill' ? 'border-green-800' : 'border-transparent'
          )}
        >
          Refill
        </button>
      </div>
      <input type="hidden" name="journey_id" value={defaultValue?.id} />
      <TextInput type="date" field={fields.date} label="Date" />
      {formType === 'journey' && (
        <TextInput field={fields.name} label="Name (optional)" placeholder="Shopping" />
      )}
      <div className="grid grid-cols-2 gap-4">
        {formType === 'journey' && (
          <TextInput type="number" field={fields.distance} label="Distance (km)" placeholder="25" />
        )}
        {formType === 'refill' && (
          <TextInput type="number" field={fields.cost} label="Kosten (CHF)" placeholder="50" />
        )}
        <TextInput
          type="number"
          field={fields.fuel_cost}
          label="Fuel cost (CHF)"
          placeholder="0,00"
        />
      </div>
      <fieldset>
        <legend className="font-bold text-sm">Members</legend>
        <div className="flex gap-4">
          {getCollectionProps(fields.member_ids, {
            type: formType === 'journey' ? 'checkbox' : 'radio',
            options: space.members.map(member => member.id.toString()),
          }).map(({ key, ...props }) => (
            <label key={props.id} htmlFor={props.id}>
              <input key={key} {...props} className="size-4" />
              <span className="ml-2">
                {space.members.find(member => member.id === parseInt(props.value))?.name}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm text-red-700">{fields.member_ids.errors}</p>
      </fieldset>
      <fieldset>
        <label className="font-bold text-sm">Car</label>
        <select
          {...getSelectProps(fields.car_id)}
          key={fields.car_id.key}
          className="block w-full p-2"
        >
          {space.cars.map(car => (
            <option key={car.id} value={car.id}>
              {car.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-red-700">{fields.car_id.errors}</p>
      </fieldset>
      {action === 'update' ? (
        <div className="flex gap-4 mt-6">
          <>
            <button
              name="intent"
              value="delete"
              className="flex-1 px-4 py-2 rounded-full bg-red-800 font-bold text-white"
            >
              Delete
            </button>
            <button
              name="intent"
              value="update"
              className="flex-1 px-4 py-2 rounded-full bg-green-800 font-bold text-white"
            >
              Update
            </button>
          </>
        </div>
      ) : (
        <button
          name="intent"
          value="create"
          className="w-full mt-6 px-4 py-2 rounded-full bg-green-800 font-bold text-white"
        >
          Create
        </button>
      )}
    </ReactRouterForm>
  )
}