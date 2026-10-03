import { z } from "zod";

/**
 * The number printed on a Vietnamese identity card, as text.
 *
 * Twelve digits for a modern CCCD, nine for the old CMND — both are still in
 * wallets and both appear on the residence form, so the length is a range
 * rather than a constant.
 *
 * Digits only: the number on the card carries no separators, and accepting them
 * would put spaces into a government form.
 *
 * Deliberately not checked against any registry, and deliberately not unique in
 * the database. This is a transcription of what is on a card somebody is
 * holding, and the only authority on it is the card.
 *
 * Shared rather than written twice: it is asked of a customer and of a visitor,
 * for the same document, and two copies of this rule would drift.
 */
export const idCardNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$|^\d{12}$/, "số định danh phải là 9 hoặc 12 chữ số");
