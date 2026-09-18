import { prisma } from "@/lib/prisma.js";
import { mapPaginated, paginate, toSkipTake } from "@/lib/pagination.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import { normalizeVi } from "@/lib/normalize-vi.js";
import type {
  IdCardConfirmInput,
  IdCardUploadInput,
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
  // Read to answer WHETHER a card is on file. The keys themselves never reach a
  // caller — a key is an address in the owner's bucket, and a screen only needs
  // to know there is something to show.
  idCardFrontKey: true,
  idCardBackKey: true,
} as const;

type SelectedCustomer = {
  idCardFrontKey: string | null;
  idCardBackKey: string | null;
};

/** What a caller sees: two facts instead of two addresses. */
function toCustomerResponse<T extends SelectedCustomer>(customer: T) {
  const { idCardFrontKey, idCardBackKey, ...rest } = customer;
  return {
    ...rest,
    hasIdCardFront: idCardFrontKey !== null,
    hasIdCardBack: idCardBackKey !== null,
  };
}

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
        throw new ConflictError("PHONE_BELONGS_TO_ANOTHER", "That phone number belongs to another account");
      }
      const customer = await prisma.user.findUnique({
        where: { id: existing.id },
        select: customerSelect,
      });
      return { customer: customer && toCustomerResponse(customer), created: false };
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

  return { customer: toCustomerResponse(customer), created: true };
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

  return mapPaginated(
    await paginate(
      query,
      prisma.user.findMany({
        where,
        select: customerSelect,
        orderBy: { createdAt: "asc" },
        ...toSkipTake(query),
      }),
      prisma.user.count({ where }),
    ),
    toCustomerResponse,
  );
}

export async function getCustomerById(id: number) {
  const customer = await prisma.user.findFirst({
    where: { id, role: "customer" },
    select: customerSelect,
  });

  if (!customer) {
    throw new NotFoundError("CUSTOMER_NOT_FOUND", "Customer not found");
  }
  return toCustomerResponse(customer);
}

export async function updateCustomer(id: number, input: UpdateCustomerInput) {
  await getCustomerById(id);

  if (input.phone) {
    const clash = await prisma.user.findFirst({
      where: { phone: input.phone, id: { not: id } },
    });
    if (clash) {
      throw new ConflictError("PHONE_ALREADY_IN_USE", "That phone number is already in use");
    }
  }

  const updated = await prisma.user.update({
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
  return toCustomerResponse(updated);
}

/**
 * One side of a customer's ID card.
 *
 * Every step follows the tenancy contract's, which is deliberate: there is one
 * story in this system about how a file reaches storage, and a second one would
 * be a second set of mistakes to make.
 */
function assertStorage() {
  if (!storage.isConfigured()) {
    throw new ValidationError(
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured on this server",
    );
  }
}

/** The column each side is recorded in. */
const SIDE_COLUMN = {
  front: "idCardFrontKey",
  back: "idCardBackKey",
} as const;

async function findCustomerRow(id: number) {
  const customer = await prisma.user.findFirst({
    where: { id, role: "customer" },
    select: { id: true, idCardFrontKey: true, idCardBackKey: true },
  });
  if (!customer) {
    throw new NotFoundError("CUSTOMER_NOT_FOUND", "Customer not found");
  }
  return customer;
}

export async function signIdCardUpload(
  id: number,
  input: IdCardUploadInput,
) {
  await findCustomerRow(id);
  assertStorage();
  return storage.signIdCardUpload(id, input.side, input.contentType);
}

export async function confirmIdCardUpload(id: number, input: IdCardConfirmInput) {
  await findCustomerRow(id);
  assertStorage();

  // Checked against this customer's own prefix rather than trusted. Without it,
  // a confirmation could attach another customer's image — or any object in the
  // bucket — to this one.
  if (!input.key.startsWith(storage.idCardPrefix(id, input.side))) {
    throw new ValidationError(
      "ID_CARD_KEY_FOREIGN",
      "That file does not belong to this customer",
    );
  }

  const object = await storage.describeObject(input.key);
  if (object === null) {
    throw new ValidationError(
      "ID_CARD_OBJECT_MISSING",
      "That file is not in storage. The upload may not have finished — try again",
    );
  }

  // A size cannot be bound into a presigned PUT, so it is enforced here. The
  // oversized object is DELETED: one nobody can reach through the application
  // is one nobody will ever clear.
  if (object.size > storage.MAX_ID_CARD_BYTES) {
    await storage.deleteObject(input.key);
    throw new ValidationError(
      "ID_CARD_FILE_TOO_LARGE",
      `That file is larger than the ${Math.round(storage.MAX_ID_CARD_BYTES / 1024 / 1024)} MB limit`,
    );
  }

  await prisma.user.update({
    where: { id },
    data: { [SIDE_COLUMN[input.side]]: input.key },
  });

  // Only this SIDE's prefix is cleared: the image being replaced, and any
  // upload that reached storage and was never confirmed. The other side lives
  // under its own prefix and is not touched.
  await storage.clearPrefixExcept(storage.idCardPrefix(id, input.side), input.key).catch(() => {});

  return getCustomerById(id);
}

export async function getIdCardDownload(id: number, side: "front" | "back") {
  const customer = await findCustomerRow(id);
  assertStorage();
  const key = customer[SIDE_COLUMN[side]];
  if (key === null) {
    throw new NotFoundError("ID_CARD_NONE_ON_FILE", "That side is not on file for this customer");
  }
  return storage.signDownload(key);
}

export async function removeIdCard(id: number, side: "front" | "back") {
  const customer = await findCustomerRow(id);
  assertStorage();
  if (customer[SIDE_COLUMN[side]] === null) {
    throw new NotFoundError("ID_CARD_NONE_ON_FILE", "That side is not on file for this customer");
  }

  await prisma.user.update({ where: { id }, data: { [SIDE_COLUMN[side]]: null } });
  await storage.clearPrefixExcept(storage.idCardPrefix(id, side), null).catch(() => {});

  return getCustomerById(id);
}
