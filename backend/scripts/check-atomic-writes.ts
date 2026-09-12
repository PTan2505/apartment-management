/**
 * Fails when one service function writes more than once outside a transaction.
 *
 * WHY A SCRIPT AND NOT A CODE REVIEW. Every multi-table write in this API is
 * already inside `prisma.$transaction`, and every helper that writes takes a
 * `tx` client rather than reaching for the singleton. That is a property of the
 * code today, held up by nobody forgetting. The failure it prevents is quiet:
 * a lease created whose occupant row was not, an invoice marked paid whose
 * deposit never moved — each leaves the database describing something that
 * never happened, and neither shows up as an error anybody sees.
 *
 * WHAT IT LOOKS FOR. Two or more writes through the `prisma` singleton inside
 * one exported service function. One is fine: a single statement is atomic in
 * Postgres by itself, and so is a Prisma nested create, which is how an invoice
 * and its line items reach two tables in one write. Two separate statements are
 * the shape that can half-succeed.
 *
 * WHAT IT CANNOT SEE, stated so the next reader does not over-trust it:
 *
 *   - It reads text, not types. A write reached through a variable holding the
 *     client, or built by a helper this file does not know about, is invisible.
 *   - It counts per function, so two functions called in sequence from a
 *     controller are two single writes as far as this is concerned.
 *   - It says nothing about whether a transaction is CORRECT — only that one is
 *     there. A transaction that commits the wrong rows passes.
 *
 * It is a floor, not a proof. The comment is here so that a future green tick
 * is not mistaken for one.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MODULES = join(import.meta.dirname, "..", "src", "modules");

/** A write through the singleton — the thing that cannot be rolled back with its neighbours. */
const DIRECT_WRITE =
  /\bprisma\.[a-zA-Z]+\.(create|createMany|createManyAndReturn|update|updateMany|upsert|delete|deleteMany)\s*\(/;

/** Opens a scope where a write is safe. */
const TRANSACTION = /\$transaction\s*\(/;

/** `export async function name(` — the unit a request runs one of. */
const EXPORTED_FN = /^export (?:async )?function (\w+)/;

/**
 * Functions that write more than once on purpose, each with the reason.
 *
 * The bar for adding one: a transaction is not merely inconvenient but WRONG
 * here, and the half-done state is both survivable and handled. Anything else
 * belongs in a transaction.
 */
const ALLOWED = new Map<string, string>([
  [
    "payment-gateway/service.ts:createGatewayPayment",
    "The row must exist before the gateway is called, because the reference the " +
      "gateway is given is the row's own id — and a transaction cannot be held " +
      "open across an HTTP call to somebody else's server. All three writes are " +
      "to one row of one table, the failure path deletes it, and a row orphaned " +
      "by a crash is ignored because the reuse check requires gatewayOrderCode.",
  ],
]);

interface Offence {
  file: string;
  fn: string;
  lines: number[];
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...tsFiles(path));
    } else if (entry.endsWith(".ts")) {
      out.push(path);
    }
  }
  return out;
}

function scan(path: string): Offence[] {
  const lines = readFileSync(path, "utf8").split("\n");
  const offences: Offence[] = [];

  let fn: string | null = null;
  let hits: number[] = [];
  let inTransaction = false;
  let depth = 0;

  const close = () => {
    // Two or more. One statement stands alone; two can half-succeed.
    if (fn !== null && hits.length > 1) {
      offences.push({ file: path, fn, lines: hits });
    }
    fn = null;
    hits = [];
    inTransaction = false;
  };

  for (const [index, line] of lines.entries()) {
    const started = EXPORTED_FN.exec(line);
    if (started) {
      close();
      fn = started[1]!;
      depth = 0;
    }
    if (fn === null) continue;

    if (TRANSACTION.test(line)) inTransaction = true;
    if (!inTransaction && DIRECT_WRITE.test(line)) hits.push(index + 1);

    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    // Back to column zero: the function has ended.
    if (depth <= 0 && line.startsWith("}")) close();
  }
  close();

  return offences;
}

const files = tsFiles(MODULES);
const all = files.flatMap(scan);

/** `payment-gateway/service.ts:createGatewayPayment` — how ALLOWED is keyed. */
function key(offence: Offence): string {
  return `${offence.file.slice(offence.file.indexOf("modules/") + "modules/".length)}:${offence.fn}`;
}

const offences = all.filter((offence) => !ALLOWED.has(key(offence)));

/*
  An entry that no longer matches anything is worse than no entry: it reads as
  a standing exemption for code that has since moved or been fixed, and it will
  silently cover whatever takes that name next.
*/
const stale = [...ALLOWED.keys()].filter((k) => !all.some((o) => key(o) === k));
if (stale.length > 0) {
  console.error("These exemptions no longer match any function. Remove them:\n");
  for (const k of stale) console.error(`  ${k}`);
  process.exit(1);
}

const scanned = files.length;

if (offences.length > 0) {
  console.error(
    "These service functions write more than once without a transaction.\n" +
      "Each one can half-succeed, leaving the database describing something\n" +
      "that never happened. Wrap them in `prisma.$transaction(async (tx) => …)`\n" +
      "and pass `tx` to any helper they call.\n",
  );
  for (const offence of offences) {
    const relative = offence.file.slice(offence.file.indexOf("src/"));
    console.error(`  ${relative}  ${offence.fn}()  dòng ${offence.lines.join(", ")}`);
  }
  console.error(
    "\nIf one of these is deliberate — an external call that cannot be held\n" +
      "inside a transaction, say — leave a comment saying so and add it to the\n" +
      "allowed list in this script, rather than widening what it accepts.",
  );
  process.exit(1);
}

console.log(
  `${scanned} tệp, không có hàm nào ghi nhiều lần ngoài transaction` +
    (ALLOWED.size > 0 ? ` (${ALLOWED.size} trường hợp được miễn có lý do)` : ""),
);
