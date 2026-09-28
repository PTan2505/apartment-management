import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

export interface PickerOption {
  /** Empty string is reserved for "not chosen" and must not be used here. */
  value: string
  label: string
  /** A second line under the label, for telling near-identical entries apart. */
  hint?: string
}

interface PickerFieldProps {
  label: string
  /** The chosen value, or '' for none. */
  value: string
  onChange: (value: string) => void
  options: PickerOption[]
  /**
   * What "nothing chosen" is called, for a FILTER — "Tất cả toà nhà".
   *
   * Omit it and the field is a required choice: clearing then becomes
   * meaningless, so the clear button is hidden.
   */
  allLabel?: string
  helperText?: string
  error?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
}

/**
 * A dropdown you can type into.
 *
 * Every list built from what the owner has ENTERED — buildings, rooms, wards,
 * cities — grows without limit, and a plain Select turns into a scroll through
 * fifty-eight room codes to reach P402. Typing narrows it; the list is still
 * there for somebody who does not know what they are looking for.
 *
 * Deliberately NOT used for closed lists — a lease's status, a payment method,
 * per-room vs per-person. Those have four entries that never change, they are
 * read rather than searched, and a text box in front of them invites typing
 * something that is not an option.
 *
 * One component rather than an Autocomplete per screen, because the details
 * that make it behave are easy to get wrong individually: matching an option
 * by VALUE rather than by object identity (React Query hands back a new array
 * on every refetch, and the selected object then stops being `===` to
 * anything in the list, which clears the field on its own), and keeping the
 * empty string as the single spelling of "not chosen".
 */
export function PickerField({
  label,
  value,
  onChange,
  options,
  allLabel,
  helperText,
  error,
  disabled,
  loading,
  placeholder,
  size,
  fullWidth = true,
}: PickerFieldProps) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_event, chosen) => onChange(chosen?.value ?? '')}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, other) => option.value === other.value}
      disabled={disabled}
      loading={loading}
      size={size}
      fullWidth={fullWidth}
      // A filter can be cleared back to "all"; a required choice cannot be
      // cleared into nothing, so it does not offer to.
      disableClearable={allLabel === undefined}
      // Vietnamese for the handful of strings MUI supplies itself.
      noOptionsText="Không có mục nào khớp"
      loadingText="Đang tải…"
      clearText="Xoá"
      openText="Mở danh sách"
      closeText="Đóng"
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        return (
          <li key={key} {...rest}>
            <span>
              {option.label}
              {option.hint && (
                <span style={{ display: 'block', opacity: 0.6, fontSize: '0.8em' }}>
                  {option.hint}
                </span>
              )}
            </span>
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder={placeholder ?? allLabel}
        />
      )}
    />
  )
}
