import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { DEFAULT_PATH } from '@/app/navigation'

/**
 * Rendered inside the shell, not instead of it, so the navigation stays usable
 * — a mistyped address should not strand you on a page with no way out.
 */
export function NotFoundPage() {
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Không tìm thấy trang
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Không có gì ở địa chỉ này. Dùng thanh điều hướng, hoặc quay về trang đầu.
      </Typography>
      <Button variant="contained" component={Link} to={DEFAULT_PATH}>
        Về danh sách toà nhà
      </Button>
    </Box>
  )
}
