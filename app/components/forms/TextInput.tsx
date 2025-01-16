import { getInputProps, type FieldMetadata } from '@conform-to/react'

export function TextInput({
  type = 'text',
  field,
  label,
  placeholder,
}: {
  type?: 'text' | 'date' | 'number'
  field: FieldMetadata<string | number | null>
  label: string
  placeholder?: string
}) {
  return (
    <fieldset>
      <label className="font-bold text-sm">{label}</label>
      <input
        {...getInputProps(field, { type })}
        key={field.key}
        placeholder={placeholder}
        className="p-2 block w-full bg-gray-100 dark:bg-gray-800"
      />
      <p className="text-sm text-red-700">{field.errors}</p>
    </fieldset>
  )
}
