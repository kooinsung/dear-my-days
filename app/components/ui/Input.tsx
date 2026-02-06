import { css, cx } from '@/styled-system/css'

type InputProps = {
  type?: 'text' | 'email' | 'password' | 'date' | 'number'
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  required?: boolean
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  className,
  required = false,
}: InputProps) {
  return (
    <div className={css({ width: '100%' })}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
      />
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
