import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import { ID_CARD_ACCEPT } from '@/features/customers/api'

interface IdCardPickerProps {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

/**
 * One side of an ID card, chosen but not yet uploaded.
 *
 * It shows what was picked. Two photographs of a card look alike at a glance
 * and go in the wrong boxes easily, and the moment to notice that is before
 * the tenancy is signed rather than months later when somebody opens the file.
 *
 * The preview is an object URL, revoked when it is replaced or the picker goes
 * away — an unrevoked one holds the image in memory for the life of the tab.
 */
export function IdCardPicker({ label, file, onChange, disabled }: IdCardPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>

      {preview === null ? (
        <Button
          variant="outlined"
          fullWidth
          startIcon={<PhotoCameraIcon />}
          disabled={disabled}
          onClick={() => input.current?.click()}
          sx={{ height: 120, borderStyle: 'dashed' }}
        >
          Chọn ảnh
        </Button>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={preview}
            alt={label}
            sx={{
              width: '100%',
              height: 120,
              // The whole card has to be visible: cropping to fill would cut
              // off exactly the edges somebody is checking.
              objectFit: 'contain',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              display: 'block',
            }}
          />
          <IconButton
            size="small"
            aria-label={`Bỏ ảnh ${label}`}
            disabled={disabled}
            onClick={() => onChange(null)}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <input
        ref={input}
        type="file"
        accept={ID_CARD_ACCEPT}
        hidden
        onChange={(event) => {
          const chosen = event.target.files?.[0] ?? null
          onChange(chosen)
          // Cleared so choosing the same file again still fires a change.
          event.target.value = ''
        }}
      />
    </Box>
  )
}
