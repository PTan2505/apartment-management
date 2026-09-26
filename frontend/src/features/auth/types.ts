/**
 * Roles the backend defines.
 *
 * `customer` still cannot sign in — a tenant reaches the portal with a link,
 * not an account. The two staff roles can, and see only what they are assigned.
 */
export type Role = 'owner' | 'manager' | 'maintenance' | 'customer'

/** A building a staff account covers, as the account itself reports it. */
export interface AccountBuilding {
  id: number
  displayName: string
}

/** The account shape returned by `GET /auth/me`. */
export interface Account {
  id: number
  /** Optional on the model — occupants may have none. Owners always do. */
  phone: string | null
  fullName: string
  role: Role
  /**
   * Whether this account holds a password somebody else issued.
   *
   * While it is true the API refuses everything but signing in, reading this
   * account, changing the password and signing out — so the application takes
   * the person straight there.
   */
  mustChangePassword: boolean
  /**
   * The buildings a staff account covers. Empty for an owner, who is not
   * narrowed at all, and for whom this says nothing.
   */
  buildings: AccountBuilding[]
  createdAt: string
  updatedAt: string
}

/** `POST /auth/refresh` returns exactly this. */
export interface TokenResponse {
  accessToken: string
}

/**
 * Signing in says whether a password change is owed, so the application can go
 * where the person has to go instead of letting them find out by being refused.
 */
export interface LoginResponse extends TokenResponse {
  mustChangePassword?: boolean
}
