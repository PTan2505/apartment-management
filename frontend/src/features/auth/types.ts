/** Roles the backend defines. Only `owner` can sign in. */
export type Role = 'owner' | 'customer'

/** The account shape returned by `GET /auth/me`. */
export interface Account {
  id: number
  /** Optional on the model — occupants may have none. Owners always do. */
  phone: string | null
  fullName: string
  role: Role
  createdAt: string
  updatedAt: string
}

/** Both `POST /auth/login` and `POST /auth/refresh` return exactly this. */
export interface TokenResponse {
  accessToken: string
}
