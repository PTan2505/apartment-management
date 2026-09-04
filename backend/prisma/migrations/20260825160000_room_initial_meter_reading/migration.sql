-- Where the meter stood when the room was added.
--
-- Nullable with no backfill, and deliberately not defaulted to zero. Rooms
-- created before this change have no reading and no figure can be invented for
-- them; null reads as "nobody has said", while 0 is a statement that the meter
-- reads zero. Conflating the two would charge an owner for a meter's whole
-- history as one month of vacancy consumption.
ALTER TABLE "Room" ADD COLUMN "initialMeterReading" INTEGER;
