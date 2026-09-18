import { useEffect, useRef, useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

/**
 * A number typed the way the owner reads it: 5.000.000, not 5000000.
 *
 * `type="number"` cannot do this — a browser number input refuses to display
 * grouped digits — so this is a text input that formats as you type and hands
 * the form a plain number. `inputMode="decimal"` still brings up the numeric
 * keypad on a phone.
 *
 * Vietnamese convention throughout: "." groups thousands and "," opens the
 * decimals. Rates are allowed a fractional part because the API records them
 * that way; money fields pass `decimals={false}` and get whole đồng only.
 */

function group(digits: string): string {
  // Leading zeros go first. The box opens on the form's 0, and typing after it
  // otherwise reads "03.500" — measured in the browser, not guessed.
  const trimmed = digits.replace(/^0+(?=\d)/, '')
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** What the field shows while it is being typed in. */
function format(raw: string, decimals: boolean): string {
  const [whole, ...rest] = raw.split(',')
  const head = group(whole.replace(/\D/g, ''))
  if (!decimals || rest.length === 0) {
    return head
  }
  // Everything after the first comma is one decimal part, however many commas
  // were pasted in.
  return `${head},${rest.join('').replace(/\D/g, '')}`
}

/** What the form stores. An empty box is `undefined`, which the schema rejects
 *  with "Nhập một con số" rather than silently reading as zero. */
function parse(text: string): number | undefined {
  const cleaned = text.replace(/\./g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '.') {
    return undefined
  }
  const value = Number(cleaned)
  return Number.isNaN(value) ? undefined : value
}

function fromValue(value: unknown, decimals: boolean): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return ''
  }
  return format(String(value).replace('.', ','), decimals)
}

interface MoneyInputProps {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  onBlur?: () => void
  /** Unit shown at the right-hand end, e.g. "đ / kWh". */
  unit?: string
  helperText?: string
  error?: boolean
  decimals?: boolean
  autoFocus?: boolean
  fullWidth?: boolean
}

/**
 * The field itself, for a form that keeps its own state. `MoneyField` below
 * wires the same thing to react-hook-form.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  onBlur,
  unit,
  helperText,
  error,
  decimals = false,
  autoFocus,
  fullWidth = true,
}: MoneyInputProps) {
  const [text, setText] = useState(() => fromValue(value, decimals))
  const input = useRef<HTMLInputElement>(null)

  // Follow the form when it is the FORM that changed the value — opening the
  // dialog on another record, a reset, a figure computed from another field.
  // Not while the box has focus, which would rewrite what someone is typing.
  useEffect(() => {
    if (document.activeElement !== input.current) {
      setText(fromValue(value, decimals))
    }
  }, [value, decimals])

  return (
    <TextField
      label={label}
      fullWidth={fullWidth}
      autoFocus={autoFocus}
      value={text}
      inputRef={input}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        const el = event.target
        // Separators appear and disappear as digits are added, so the caret is
        // restored by counting DIGITS before it, not characters.
        const digitsBefore = el.value
          .slice(0, el.selectionStart ?? el.value.length)
          .replace(/\D/g, '').length
        const next = format(el.value, decimals)
        setText(next)
        onChange(parse(next))
        requestAnimationFrame(() => {
          let seen = 0
          let at = 0
          while (at < next.length && seen < digitsBefore) {
            if (/\d/.test(next[at])) {
              seen += 1
            }
            at += 1
          }
          el.setSelectionRange(at, at)
        })
      }}
      onBlur={() => {
        setText(fromValue(value, decimals))
        onBlur?.()
      }}
      error={error}
      helperText={helperText}
      slotProps={{
        htmlInput: { inputMode: decimals ? 'decimal' : 'numeric' },
        input: unit
          ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }
          : undefined,
      }}
    />
  )
}

interface MoneyFieldProps<T extends FieldValues>
  extends Omit<MoneyInputProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  control: Control<T>
  name: FieldPath<T>
}

/** The same field, bound to a react-hook-form control. */
export function MoneyField<T extends FieldValues>({
  control,
  name,
  helperText,
  ...rest
}: MoneyFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  return (
    <MoneyInput
      {...rest}
      value={typeof field.value === 'number' ? field.value : undefined}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
    />
  )
}
