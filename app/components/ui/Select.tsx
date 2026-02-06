import { css, cx } from '@/styled-system/css'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  required?: boolean
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  className,
  required = false,
}: SelectProps) {
  return (
    <div className={css({ width: '100%' })}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={cx(
          css({
            width: '100%',
            padding: '10px 12px',
            border: '1px solid',
            borderColor: error ? 'red.500' : 'gray.300',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'white',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            _focus: {
              borderColor: error ? 'red.500' : 'blue.500',
            },
            _disabled: {
              backgroundColor: 'gray.100',
              cursor: 'not-allowed',
            },
          }),
          className,
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          className={css({
            color: 'red.500',
            fontSize: '12px',
            marginTop: '4px',
          })}
        >
          {error}
        </p>
      )}
    </div>
  )
}
