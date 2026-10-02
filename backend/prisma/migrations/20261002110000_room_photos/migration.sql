-- Photographs of a room.
--
-- The fourth table of this shape, after damage-report photographs, contract
-- pages and ID cards. Cascades with the room: a deleted room's pictures are of
-- nothing.

CREATE TABLE "RoomPhoto" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomPhoto_key_key" ON "RoomPhoto"("key");
CREATE INDEX "RoomPhoto_roomId_uploadedAt_idx" ON "RoomPhoto"("roomId", "uploadedAt");

ALTER TABLE "RoomPhoto"
  ADD CONSTRAINT "RoomPhoto_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
