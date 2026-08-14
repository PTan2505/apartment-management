import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
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
      phone: input.phone ?? null,
      role: "customer",
    },
    select: customerSelect,
  });

  return { customer, created: true };
}

export async function listCustomers(query: ListCustomersQuery) {
  return prisma.user.findMany({
    where: {
      role: "customer",
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" as const } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    },
    select: customerSelect,
    orderBy: { createdAt: "asc" },
  });
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
    data: input,
    select: customerSelect,
  });
}
