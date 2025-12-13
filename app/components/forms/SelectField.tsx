import { getSelectProps, type FieldMetadata } from '@conform-to/react'

export function SelectField({
  field,
  options,
}: {
  field: FieldMetadata
  options: { value: string; label: string }[]
}) {
  return (
    <fieldset>
      <label className="font-bold text-sm">Car</label>
      <select {...getSelectProps(field)} className="block w-full p-2 bg-gray-100 dark:bg-gray-800">
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-sm text-red-700">{field.errors}</p>
    </fieldset>
  )
}
