/**
 * Whether a building or a room is in service, as the three answers a filter
 * needs: everything, only what is running, only what has been stopped.
 *
 * The API defaults to `active` when the parameter is absent, so a caller that
 * never asked about retirement keeps the list it always had. The SCREENS ask
 * for `all` — an owner looking at their own buildings should see the ones they
 * took out of service, not have them hidden until they think to look.
 */
export type ActiveStatus = 'active' | 'inactive' | 'all'

export const ACTIVE_STATUS_OPTIONS: { value: ActiveStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đang ngưng hoạt động' },
]

/** What a screen shows when its address carries no status: everything. */
export function statusFromParam(value: string | undefined): ActiveStatus {
  return value === 'active' || value === 'inactive' ? value : 'all'
}
