import { getCollectionProps, getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, Link, useActionData, useNavigation } from 'react-router'
import { TextField } from '../forms/TextField'
import type { Tables } from 'database.types'
import { refillSchema } from 'lib/schema/refill'
import { SelectField } from '../forms/SelectField'
import { TabNav } from './TabNav'
import * as Dialog from '@radix-ui/react-dialog'

export function RefillForm({
  space,
  action,
  defaultValue,
}: {
  space: Tables<'spaces'> & { members: Tables<'members'>[]; cars: Tables<'cars'>[] }
} & (
  | { action: 'create'; defaultValue?: undefined }
  | {
      action: 'update'
      defaultValue: Omit<Tables<'refills'>, 'member_id'> & { member_id: string }
    }
)) {
  const lastResult = useActionData()
  const [form, fields] = useForm({
    lastResult,
    defaultValue:
      action === 'update'
        ? defaultValue
        : {
            date: new Date().toISOString().split('T')[0],
            fuel_cost: 1.75,
          },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: refillSchema,
      })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  const navigation = useNavigation()

  return (
    <>
      <div className="flex items-start">
        {action === 'create' && <TabNav spaceId={space.id} />}
        <Link to={`/spaces/${space.id}`} className="ml-auto p-2">
          Close
        </Link>
      </div>
      <Dialog.Title className="capitalize">{action} refill</Dialog.Title>
      <Form method="post" {...getFormProps(form)} className="grid gap-4">
        <input hidden name="space_id" value={space.id} />
        <TextField type="date" field={fields.date} label="Date" />
        <div className="grid grid-cols-2 gap-4">
          <TextField type="number" field={fields.cost} label="Cost (CHF)" placeholder="50" />
          <TextField
            type="number"
            field={fields.fuel_cost}
            label="Fuel cost (CHF)"
            placeholder="0,00"
          />
        </div>
        <fieldset>
          <legend className="font-bold text-sm">Who refilled?</legend>
          <div className="flex gap-4">
            {getCollectionProps(fields.member_id, {
              type: 'radio',
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
          <p className="text-sm text-red-700">{fields.member_id.errors}</p>
        </fieldset>
        <SelectField
          field={fields.car_id}
          options={space.cars.map(car => ({ value: car.id.toString(), label: car.name }))}
        />
        {action === 'update' ? (
          <div className="flex flex-row-reverse gap-4 mt-6">
            <button
              disabled={navigation.state === 'submitting'}
              className="flex-1 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
            >
              {navigation.state === 'submitting' ? 'Loading ...' : 'Update'}
            </button>
            <button
              form="delete-refill"
              disabled={navigation.state === 'submitting'}
              className="flex-1 px-4 py-2 rounded-full bg-red-800 font-bold text-white disabled:opacity-30"
            >
              {navigation.state === 'submitting' ? 'Loading ...' : 'Delete'}
            </button>
          </div>
        ) : (
          <button
            disabled={navigation.state === 'submitting'}
            className="w-full mt-6 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
          >
            {navigation.state === 'submitting' ? 'Loading ...' : 'Create'}
          </button>
        )}
      </Form>
      {action === 'update' && (
        <Form
          id="delete-refill"
          action={`/spaces/${space.id}/refills/${defaultValue.id}/delete`}
          method="post"
        />
      )}
    </>
  )
}
