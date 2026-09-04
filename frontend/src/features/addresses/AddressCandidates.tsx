import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'

import { isApiError } from '@/lib/api-error'
import { useAddressCandidates } from '@/features/addresses/hooks'
import type { AddressCandidate } from '@/features/addresses/types'

interface AddressCandidatesProps {
  /** Already debounced by the caller — every value here is worth a request. */
  term: string
  sessionToken: string
  onChoose: (candidate: AddressCandidate) => void
}

/**
 * The suggestions under the street address field.
 *
 * There is no search box of its own: the street address field *is* the search.
 * Typing an address looks for it; choosing a suggestion fills the rest.
 */
export function AddressCandidates({ term, sessionToken, onChoose }: AddressCandidatesProps) {
  const query = useAddressCandidates(term, sessionToken, true)
  const candidates = query.data ?? []
  const searching = term.trim().length > 0

  if (isApiError(query.error)) {
    // Not configured, or the provider is down. Either way the fields below stay
    // editable, so this is information rather than an obstacle.
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {query.error.message} You can type the address yourself.
      </Alert>
    )
  }

  if (searching && !query.isFetching && candidates.length === 0) {
    // Matching nothing is an ordinary outcome of typing an address that the
    // provider does not know — not a failure.
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Không tìm thấy địa chỉ khớp. Bạn có thể tự nhập phần còn lại.
      </Alert>
    )
  }

  if (candidates.length === 0) return null

  return (
    <Paper variant="outlined" sx={{ mt: 1, maxHeight: 220, overflowY: 'auto' }}>
      <List dense disablePadding>
        {candidates.map((candidate) => (
          <ListItemButton key={candidate.placeId} onClick={() => onChoose(candidate)}>
            <ListItemText primary={candidate.description} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  )
}
