import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
import { normalizeVi } from "@/lib/normalize-vi.js";
import type {
  ListCustomersQuery,
  RegisterCustomerInput,
  UpdateCustomerInput,
} from "./schema.js";

// Explicit selection so password material can never leak into a response by
// being added to the model later.
const customerSelect = {
  id: true,
  phone: true,
  fullName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface RegisterResult {
  customer: Awaited<ReturnType<typeof prisma.user.findFirst>>;
  created: boolean;
}

export async function registerCustomer(input: RegisterCustomerInput) {
  // Without a phone there is nothing to match on, so always create. Name-based
  // matching would silently merge distinct people.
  if (input.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });

    if (existing) {
      if (existing.role !== "customer") {
        throw new ConflictError("That phone number belongs to another account");
      }
      const customer = await prisma.user.findUnique({
        where: { id: existing.id },
        select: customerSelect,
      });
      return { customer, created: false };
    }
  }

  const customer = await prisma.user.create({
    data: {
      fullName: input.fullName,
      fullNameSearch: normalizeVi(input.fullName),
      phone: input.phone ?? null,
      role: "customer",
    },
    select: customerSelect,
  });

  return { customer, created: true };
}

export async function listCustomers(query: ListCustomersQuery) {
  const where = {
    role: "customer" as const,
    ...(query.search
      ? {
          OR: [
            // Matched against the derived key, not the name itself. The
            // database's C collation folds case for ASCII only, so comparing
            // the name directly is case-sensitive for exactly the letters
            // Vietnamese names are made of. Both sides go through the same
            // helper, so the query needs no preparation by the caller.
            { fullNameSearch: { contains: normalizeVi(query.search) } },
            // Deliberately not normalised: every character of a phone number is
            // significant, and none of them has a case or a diacritic.
            { phone: { contains: query.search } },
          ],
        }
      : {}),
  };

  return paginate(
    query,
    prisma.user.findMany({
      where,
      select: customerSelect,
      orderBy: { createdAt: "asc" },
      ...toSkipTake(query),
    }),
    prisma.user.count({ where }),
  );
}

export async function getCustomerById(id: number) {
  const customer = await prisma.user.findFirst({
    where: { id, role: "customer" },
    select: customerSelect,
  });

  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  return customer;
}

export async function updateCustomer(id: number, input: UpdateCustomerInput) {
  await getCustomerById(id);

  if (input.phone) {
    const clash = await prisma.user.findFirst({
      where: { phone: input.phone, id: { not: id } },
    });
    if (clash) {
      throw new ConflictError("That phone number is already in use");
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...input,
      // Only when the name is actually changing. Deriving the key
      // unconditionally would blank it on an update that touches only the
      // phone — `normalizeVi(undefined)` is not the issue, an empty key is: the
      // customer would quietly stop matching any search, with nothing to show
      // that anything went wrong.
      ...(input.fullName === undefined
        ? {}
        : { fullNameSearch: normalizeVi(input.fullName) }),
    },
    select: customerSelect,
  });
}
