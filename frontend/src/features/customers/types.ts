import type { PageMeta } from '@/components/Pagination'

export interface Customer {
  id: number
  /** Null for someone with no phone of their own, such as a child occupant. */
  phone: string | null
  fullName: string
  role: 'customer'
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ListCustomersParams {
  page?: number
  pageSize?: number
  search?: string
}

/**
 * The outcome of submitting the create form.
 *
 * `POST /customers` is find-or-create rather than create: a phone number
 * already on file returns the person holding it and creates nobody, discarding
 * the name that was submitted. Both outcomes answer 2xx, so nothing about the
 * promise resolving distinguishes them.
 *
 * `created` is therefore carried alongside the customer rather than inferred
 * from it. The customer is never returned on its own — a caller that has one
 * always has the flag next to it, so treating a match as a creation has to be
 * written deliberately rather than by omission.
 */
export interface CreateCustomerResult {
  /** True when a new person was created; false when an existing one was matched. */
  created: boolean
  /**
   * On `created: false` this is the person who already holds the phone number,
   * not the person whose name was submitted.
   */
  customer: Customer
}
