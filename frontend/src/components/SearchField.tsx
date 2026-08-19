import { useEffect, useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'

type SearchFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string
  /** Called once typing settles, not on every keystroke. */
  onDebouncedChange: (value: string) => void
  delayMs?: number
}

/**
 * A search box that reports its value once typing settles.
 *
 * Typing "A-101" is five renders; without this it is five requests, four of
 * them immediately discarded. The visible value updates at once — only what is
 * reported waits.
 *
 * Debouncing is only half the problem for a search whose value lives in the
 * URL. The other half is that each reported change must *replace* the history
 * entry rather than push one, or the browser's back control walks backwards
 * through the term one character at a time. That belongs to whoever owns the
 * URL, so it lives in `useListParams` rather than here.
 */
export function SearchField({
  value,
  onDebouncedChange,
  delayMs = 350,
  ...props
}: SearchFieldProps) {
  const [text, setText] = useState(value)

  // Keeps the box in step when the value changes from outside — cleared by a
  // reset, or restored from the URL on a fresh load.
  useEffect(() => {
    setText(value)
  }, [value])

  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onDebouncedChange(text), delayMs)
    return () => clearTimeout(timer)
    // `value` is deliberately absent: including it restarts the timer when the
    // caller echoes the reported value back, delaying every settled change by
    // another full interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delayMs, onDebouncedChange])

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) => setText(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
        ...props.slotProps,
      }}
    />
  )
}
