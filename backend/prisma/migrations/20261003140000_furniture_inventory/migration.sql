-- Furniture: what a building supplies, what a room holds, what a tenant received.
--
-- Three tables rather than a many-to-many, because each answers a question the
-- others cannot:
--
--   FurnitureItem   "what does this building furnish rooms with?"
--   RoomFurniture   "what is in P101?"            — answerable with no tenancy
--   LeaseFurniture  "what did THIS tenant get?"   — frozen, survives every later change
--
-- Nothing existing changes meaning. Every tenancy signed before now simply has
-- no hand-over record, which the screens must read as "no record" rather than
-- "handed over with nothing".

CREATE TYPE "FurnitureCondition" AS ENUM ('new', 'good', 'worn', 'damaged');

-- ── The building's catalogue ──────────────────────────────────────────────

CREATE TABLE "FurnitureItem" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "make" TEXT,
    "unitValue" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FurnitureItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FurnitureItem_buildingId_idx" ON "FurnitureItem"("buildingId");

-- Unique among the building's OFFERED entries only, the same shape as
-- Room.roomCode and BuildingServiceFee.name. Prisma's @@unique cannot express
-- a WHERE clause, and a plain unique index would block reusing the name of
-- something retired.
CREATE UNIQUE INDEX "FurnitureItem_buildingId_name_active_key"
  ON "FurnitureItem"("buildingId", "name") WHERE "isActive" = true;

ALTER TABLE "FurnitureItem"
  ADD CONSTRAINT "FurnitureItem_buildingId_fkey"
  FOREIGN KEY ("buildingId") REFERENCES "Building"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── What a room holds ─────────────────────────────────────────────────────

CREATE TABLE "RoomFurniture" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "furnitureItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitValue" DECIMAL(12,2) NOT NULL,
    "condition" "FurnitureCondition" NOT NULL,
    "note" TEXT,
    "acquiredOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomFurniture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomFurniture_roomId_idx" ON "RoomFurniture"("roomId");
CREATE INDEX "RoomFurniture_furnitureItemId_idx" ON "RoomFurniture"("furnitureItemId");

-- Cascades with the room: a deleted room's contents are of nothing. RESTRICT
-- on the catalogue entry, deliberately — a catalogue entry a room still holds
-- must be retired, not deleted, and the constraint says so where it cannot be
-- bypassed.
ALTER TABLE "RoomFurniture"
  ADD CONSTRAINT "RoomFurniture_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoomFurniture"
  ADD CONSTRAINT "RoomFurniture_furnitureItemId_fkey"
  FOREIGN KEY ("furnitureItemId") REFERENCES "FurnitureItem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── What a tenant received ────────────────────────────────────────────────

-- No foreign key to the catalogue on purpose. The name, kind and make are
-- copied as TEXT so that retiring an entry — or throwing the item out — cannot
-- quietly empty a record whose job is to settle a disagreement.
--
-- "returnCondition" is NULLABLE and null means NOBODY LOOKED. Not checked,
-- returned in good order, and returned damaged are three different facts.
CREATE TABLE "LeaseFurniture" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "make" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitValue" DECIMAL(12,2) NOT NULL,
    "handoverCondition" "FurnitureCondition" NOT NULL,
    "handoverNote" TEXT,
    "handedOverOn" TIMESTAMP(3) NOT NULL,
    "returnCondition" "FurnitureCondition",
    "returnNote" TEXT,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseFurniture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeaseFurniture_leaseId_idx" ON "LeaseFurniture"("leaseId");

ALTER TABLE "LeaseFurniture"
  ADD CONSTRAINT "LeaseFurniture_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES "Lease"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
