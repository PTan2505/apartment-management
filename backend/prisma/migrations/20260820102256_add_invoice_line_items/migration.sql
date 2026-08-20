-- Moves an invoice's charges from fixed columns onto rows.
--
-- Order is load-bearing: create the table, convert the existing invoices, and
-- only THEN drop the columns. Dropping first would destroy the data the
-- conversion reads, and the conversion would silently produce nothing.
--
-- Written by hand rather than generated: dropping columns that hold data needs
-- an interactive confirmation Prisma cannot get here, and the three steps have
-- to be ordered deliberately in any case.

CREATE TYPE "InvoiceLineKind" AS ENUM ('rent', 'electricity', 'water');

CREATE TABLE "InvoiceLineItem" (
    "id"          SERIAL           NOT NULL,
    "invoiceId"   INTEGER          NOT NULL,
    "kind"        "InvoiceLineKind" NOT NULL,
    "description" TEXT             NOT NULL,
    "quantity"    DECIMAL(14,2),
    "unitAmount"  DECIMAL(12,4),
    "amount"      DECIMAL(14,0)    NOT NULL,
    "position"    INTEGER          NOT NULL,
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

ALTER TABLE "InvoiceLineItem"
  ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Convert every existing invoice into three lines, carrying each rate and count
-- onto the charge it produced. Positions match the order charges are presented.
--
-- Rent takes no quantity: a fabricated 1 would read as information and is not.
-- For a prorated invoice `amount` is already the reduced figure while
-- `unitAmount` stays the full-month basis — the invoice's own period accounts
-- for the difference.
INSERT INTO "InvoiceLineItem" ("invoiceId", "kind", "description", "quantity", "unitAmount", "amount", "position")
SELECT "id", 'rent', 'Rent', NULL, "baseRent", "rentAmount", 1 FROM "Invoice";

INSERT INTO "InvoiceLineItem" ("invoiceId", "kind", "description", "quantity", "unitAmount", "amount", "position")
SELECT "id", 'electricity',
       'Electricity ' || ("currentElectricityUse" - "previousElectricityUse")::text || ' kWh',
       ("currentElectricityUse" - "previousElectricityUse")::decimal,
       "electricityRate", "electricityAmount", 2
FROM "Invoice";

INSERT INTO "InvoiceLineItem" ("invoiceId", "kind", "description", "quantity", "unitAmount", "amount", "position")
SELECT "id", 'water',
       'Water, ' || "occupantCount"::text || ' occupant(s)',
       "occupantCount"::decimal, "waterRatePerPerson", "waterAmount", 3
FROM "Invoice";

-- Only now that every charge has been copied onto a line.
ALTER TABLE "Invoice"
  DROP COLUMN "rentAmount",
  DROP COLUMN "electricityAmount",
  DROP COLUMN "waterAmount",
  DROP COLUMN "baseRent",
  DROP COLUMN "electricityRate",
  DROP COLUMN "waterRatePerPerson",
  DROP COLUMN "occupantCount";
