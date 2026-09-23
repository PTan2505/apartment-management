import Box from "@mui/material/Box";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** The one thing this screen exists to add. Top right, on every screen. */
  action?: ReactNode;
}

/**
 * The row every list screen opens with.
 *
 * Its job is the action's POSITION. Before this, the button to add something
 * sat in three different places depending on the screen — beside the title on
 * buildings and expenses, above the table inside the frame on rooms and
 * tenancies, and tucked at the end of the filter row on customers — so the
 * first thing an owner does on a screen was somewhere new each time.
 *
 * It no longer carries a title: the shell already names the page in the bar
 * above, and the two said the same word twice on every screen.
 *
 * It wraps rather than shrinks at phone width, so the button keeps its label.
 */
export function PageHeader({ action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "end",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        mb: 2,
      }}
    >
      {action}
    </Box>
  );
}
