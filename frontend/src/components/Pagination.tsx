import Box from '@mui/material/Box'
import MuiPagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

/** The paged-response shape every list endpoint returns. */
export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface PaginationProps {
  meta: PageMeta
  onPageChange: (page: number) => void
}

/**
 * Bound to the shared pagination contract, so every list screen reports totals
 * the same way.
 *
 * Hidden when everything fits on one page: a pager offering a single page is
 * noise, and `totalPages` is 0 when there are no results at all.
 */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  const first = (meta.page - 1) * meta.pageSize + 1
  const last = Math.min(meta.page * meta.pageSize, meta.total)

  return (
    <Box
      sx={{
        mt: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {first}–{last} of {meta.total}
      </Typography>
      <MuiPagination
        count={meta.totalPages}
        page={meta.page}
        onChange={(_event, value) => onPageChange(value)}
        // Narrow screens cannot fit the full run of page buttons.
        siblingCount={0}
        boundaryCount={1}
      />
    </Box>
  )
}
