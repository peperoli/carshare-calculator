import { getCollectionProps, getSelectProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form as ReactRouterForm, useActionData, useLoaderData, useNavigation } from 'react-router'
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
  intent: z.enum(['create-journey', 'update-journey', 'delete-journey']),
})

export const refillSchema = z.object({
  refill_id: z.number().optional(),
  date: z.string(),
  cost: z.number().min(1),
  fuel_cost: z.number().min(0.01),
  member_id: z.string(),
  car_id: z.number(),
  intent: z.enum(['create-refill', 'update-refill', 'delete-refill']),
})

export function Form({
  action,
  ...props
}:
  | { action: 'create' }
  | {
      action: 'update'
      ressourceType: 'journey'
      defaultValue: Tables<'journeys'> & { member_ids: string[] }
    }
  | {
      action: 'update'
      ressourceType: 'refill'
      defaultValue: Omit<Tables<'refills'>, 'member_id'> & { member_id: string }
    }) {
  const { space } = useLoaderData<typeof loader>()
  const lastResult = useActionData()
  const [ressourceType, setRessourceType] = useState<'journey' | 'refill'>(
    'ressourceType' in props ? props.ressourceType : 'journey'
  )
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,
    defaultValue:
      action === 'update' && 'ressourceType' in props
        ? props.defaultValue
        : {
            date: new Date().toISOString().split('T')[0],
            fuel_cost: 1.75,
          },
    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: ressourceType === 'journey' ? journeySchema : refillSchema,
      })
    },
    // Validate the form on blur event triggered
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  const navigation = useNavigation()

  return (
    <ReactRouterForm
      method="post"
      id={form.id}
      onSubmit={form.onSubmit}
      action={`/spaces/${space.id}`}
      noValidate
      className="grid gap-4"
    >
      <h2 className="capitalize">
        {action} {ressourceType}
      </h2>
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
      {action === 'update' && 'ressourceType' in props && props.ressourceType === 'journey' && (
        <input type="hidden" name="journey_id" value={props.defaultValue?.id} />
      )}
      {action === 'update' && 'ressourceType' in props && props.ressourceType === 'refill' && (
        <input type="hidden" name="refill_id" value={props.defaultValue?.id} />
      )}
      <TextInput type="date" field={fields.date} label="Date" />
      {ressourceType === 'journey' && (
        <TextInput field={fields.name} label="Name (optional)" placeholder="Shopping" />
      )}
      <div className="grid grid-cols-2 gap-4">
        {ressourceType === 'journey' && (
          <TextInput type="number" field={fields.distance} label="Distance (km)" placeholder="25" />
        )}
        {ressourceType === 'refill' && (
          // @ts-expect-error
          <TextInput type="number" field={fields.cost} label="Cost (CHF)" placeholder="50" />
        )}
        <TextInput
          type="number"
          field={fields.fuel_cost}
          label="Fuel cost (CHF)"
          placeholder="0,00"
        />
      </div>
      {ressourceType === 'journey' && (
        <fieldset>
          <legend className="font-bold text-sm">Who traveled?</legend>
          <div className="flex gap-4">
            {getCollectionProps(fields.member_ids, {
              type: 'checkbox',
              options: space.members.map(member => member.id.toString()),
            }).map(({ key, ...inputProps }) => (
              <label key={inputProps.id} htmlFor={inputProps.id}>
                <input key={key} {...inputProps} className="size-4" />
                <span className="ml-2">
                  {space.members.find(member => member.id === parseInt(inputProps.value))?.name}
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-red-700">{fields.member_ids.errors}</p>
        </fieldset>
      )}
      {ressourceType === 'refill' && (
        <fieldset>
          <legend className="font-bold text-sm">Who refilled?</legend>
          <div className="flex gap-4">
            {
              // @ts-expect-error
              getCollectionProps(fields.member_id, {
                type: 'radio',
                options: space.members.map(member => member.id.toString()),
              }).map(({ key, ...inputProps }) => (
                <label key={inputProps.id} htmlFor={inputProps.id}>
                  <input key={key} {...inputProps} className="size-4" />
                  <span className="ml-2">
                    {space.members.find(member => member.id === parseInt(inputProps.value))?.name}
                  </span>
                </label>
              ))
            }
          </div>
          <p className="text-sm text-red-700">
            {
              // @ts-expect-error
              fields.member_id.errors
            }
          </p>
        </fieldset>
      )}
      <fieldset>
        <label className="font-bold text-sm">Car</label>
        <select
          {...getSelectProps(fields.car_id)}
          key={fields.car_id.key}
          className="block w-full p-2 bg-gray-100 dark:bg-gray-800"
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
        <div className="flex flex-row-reverse gap-4 mt-6">
          <button
            name="intent"
            value={ressourceType === 'journey' ? 'update-journey' : 'update-refill'}
            disabled={navigation.state === 'submitting'}
            className="flex-1 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
          >
            {navigation.state === 'submitting' ? 'Loading ...' : 'Update'}
          </button>
          <button
            name="intent"
            value={ressourceType === 'journey' ? 'delete-journey' : 'delete-refill'}
            disabled={navigation.state === 'submitting'}
            className="flex-1 px-4 py-2 rounded-full bg-red-800 font-bold text-white disabled:opacity-30"
          >
            {navigation.state === 'submitting' ? 'Loading ...' : 'Delete'}
          </button>
        </div>
      ) : (
        <button
          name="intent"
          value={ressourceType === 'journey' ? 'create-journey' : 'create-refill'}
          disabled={navigation.state === 'submitting'}
          className="w-full mt-6 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
        >
          {navigation.state === 'submitting' ? 'Loading ...' : 'Create'}
        </button>
      )}
    </ReactRouterForm>
  )
}
