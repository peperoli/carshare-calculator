import { getCollectionProps, getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, Link, useActionData, useNavigation } from 'react-router'
import { TextField } from '../forms/TextField'
import type { Tables } from 'database.types'
import { journeySchema } from 'lib/schema/journey'
import { SelectField } from '../forms/SelectField'
import * as Dialog from '@radix-ui/react-dialog'
import { TabNav } from './TabNav'
import { LoaderCircle, LoaderCircleIcon, TrashIcon, XIcon } from 'lucide-react'

export function JourneyForm({
  space,
  action,
  defaultValue,
}: { space: Tables<'spaces'> & { members: Tables<'members'>[]; cars: Tables<'cars'>[] } } & (
  | { action: 'create'; defaultValue?: undefined }
  | {
      action: 'update'
      defaultValue: Tables<'journeys'> & { member_ids: string[] }
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
        schema: journeySchema,
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
        <Link to={`/spaces/${space.id}`} className="btn-icon absolute right-4 top-8">
          <XIcon className="size-5" />
        </Link>
      </div>
      <Dialog.Title className="capitalize">{action} journey</Dialog.Title>
      <Form method="post" {...getFormProps(form)} className="grid gap-4">
        <input type="hidden" name="space_id" value={space.id} />
        <TextField type="date" field={fields.date} label="Date" />
        <TextField field={fields.name} label="Name (optional)" placeholder="Shopping" />
        <div className="grid grid-cols-2 gap-4">
          <TextField type="number" field={fields.distance} label="Distance (km)" placeholder="25" />
          <TextField
            type="number"
            field={fields.fuel_cost}
            label="Fuel cost (CHF)"
            placeholder="0,00"
          />
        </div>
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
        <SelectField
          field={fields.car_id}
          options={space.cars.map(car => ({ value: car.id.toString(), label: car.name }))}
        />
        {action === 'update' ? (
          <div className="flex flex-row-reverse gap-4 mt-6">
            <button disabled={navigation.state === 'submitting'} className="flex-1 btn btn-primary">
              {navigation.state === 'submitting' && (
                <LoaderCircleIcon className="size-5 animate-spin" />
              )}
              Update
            </button>
            <button
              form="delete-journey"
              disabled={navigation.state === 'submitting'}
              className="btn-icon btn-secondary btn-danger"
            >
              {navigation.state === 'submitting' ? (
                <LoaderCircleIcon className="size-5 animate-spin" />
              ) : (
                <TrashIcon className="size-5" />
              )}
            </button>
          </div>
        ) : (
          <button disabled={navigation.state === 'submitting'} className="btn btn-primary mt-6">
            {navigation.state === 'submitting' && (
              <LoaderCircleIcon className="size-5 animate-spin" />
            )}
            Create
          </button>
        )}
      </Form>
      {action === 'update' && (
        <Form
          id="delete-journey"
          action={`/spaces/${space.id}/journeys/${defaultValue.id}/delete`}
          method="post"
        />
      )}
    </>
  )
}
