import { apiClient } from '@/lib/api-client'
import type {
  CreateCustomerResult,
  Customer,
  ListCustomersParams,
  Paginated,
} from '@/features/customers/types'
import type { CustomerFormOutput } from '@/features/customers/schema'

function toQuery(params: ListCustomersParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  // One field matches both name and phone, so there is nothing to say about
  // which the text is.
  if (params.search) query.search = params.search
  return query
}

export async function listCustomers(
  params: ListCustomersParams,
): Promise<Paginated<Customer>> {
  const { data } = await apiClient.get<Paginated<Customer>>('/customers', {
    params: toQuery(params),
  })
  return data
}

/**
 * Creates a customer, or reports that the phone number already belongs to one.
 *
 * The status code is the only thing that separates the two, and this is the one
 * place it is visible — by the time a caller has the parsed body, a created
 * person and a matched one look identical. So the distinction is captured here
 * rather than reconstructed later.
 *
 * It cannot be reconstructed later, in fact: comparing the returned name to the
 * submitted one fails exactly when someone with the same name already holds the
 * number, which is the case most likely to mislead.
 *
 *   201 → created: true   a new person exists
 *   200 → created: false  `customer` is whoever already held the phone number,
 *                         and the submitted name was not saved anywhere
 *   409 → throws          the number belongs to an owner account
 */
export async function createCustomer(
  input: CustomerFormOutput,
): Promise<CreateCustomerResult> {
  const response = await apiClient.post<Customer>('/customers', input)
  return { created: response.status === 201, customer: response.data }
}

/** Answers 409 when the phone number already belongs to someone else. */
export async function updateCustomer(
  id: number,
  input: CustomerFormOutput,
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}`, input)
  return data
}
