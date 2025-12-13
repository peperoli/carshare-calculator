import { getCollectionProps, getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router'
import { TextInput } from '../forms/TextInput'
import type { Tables } from 'database.types'
import type { loader } from '~/routes/spaces.$id'
import { refillSchema } from 'lib/schema/refill'
import { SelectField } from '../forms/SelectField'

export function RefillForm({
  spaceId,
  action,
  defaultValue,
}: { spaceId: number } & (
  | { action: 'create'; defaultValue?: undefined }
  | {
      action: 'update'
      defaultValue: Omit<Tables<'refills'>, 'member_id'> & { member_id: string }
    }
)) {
  const { space } = useLoaderData<typeof loader>()
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
      <Form
        method="post"
        action={action === 'update' ? `/refills/${defaultValue.id}/update` : '/refills/create'}
        {...getFormProps(form)}
        className="grid gap-4"
      >
        <h2 className="capitalize">{action} refill</h2>
        <input hidden name="space_id" value={spaceId} />
        <TextInput type="date" field={fields.date} label="Date" />
        <div className="grid grid-cols-2 gap-4">
          <TextInput type="number" field={fields.cost} label="Cost (CHF)" placeholder="50" />
          <TextInput
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
      </Form>
      {action === 'update' ? (
        <div className="flex flex-row-reverse gap-4 mt-6">
          <button
            form={form.id}
            disabled={navigation.state === 'submitting'}
            className="flex-1 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
          >
            {navigation.state === 'submitting' ? 'Loading ...' : 'Update'}
          </button>
          <Form action={`/refills/${defaultValue.id}/delete`} method="post">
            <button
              disabled={navigation.state === 'submitting'}
              className="flex-1 px-4 py-2 rounded-full bg-red-800 font-bold text-white disabled:opacity-30"
            >
              {navigation.state === 'submitting' ? 'Loading ...' : 'Delete'}
            </button>
          </Form>
        </div>
      ) : (
        <button
          form={form.id}
          disabled={navigation.state === 'submitting'}
          className="w-full mt-6 px-4 py-2 rounded-full bg-green-800 font-bold text-white disabled:opacity-30"
        >
          {navigation.state === 'submitting' ? 'Loading ...' : 'Create'}
        </button>
      )}
    </>
  )
}
