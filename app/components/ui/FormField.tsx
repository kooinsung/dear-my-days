import { css } from '@/styled-system/css'

type FormFieldProps = {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  required = false,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: This is a wrapper component, the actual control is passed as children */}
      <label
        className={css({
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '6px',
          color: 'gray.700',
        })}
      >
        {label}
        {required && (
          <span className={css({ color: 'red.500', marginLeft: '2px' })}>
            *
          </span>
        )}
      </label>
      {children}
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
