import bcrypt from "bcrypt";
import { env } from "@/config/env.js";
import { prisma } from "@/lib/prisma.js";
import { normalizeVi } from "@/lib/normalize-vi.js";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

/**
 * Where this is about to write, named out loud.
 *
 * DATABASE_URL comes from `.env` unless one is set on the command line, and an
 * inline value wins — which is how this script is pointed at production from a
 * machine whose `.env` points at localhost. That precedence is easy to get
 * backwards, and getting it backwards means creating an owner account on the
 * wrong database and believing you created it on the right one.
 *
 * Host and database only. The credentials in the URL are never printed.
 */
function describeTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main() {
  const phone = readArg("--phone") ?? process.env.SEED_OWNER_PHONE;
  const password = readArg("--password") ?? process.env.SEED_OWNER_PASSWORD;
  const fullName = readArg("--name") ?? process.env.SEED_OWNER_NAME;

  if (!phone || !password || !fullName) {
    console.error(
      "Usage: npm run seed:owner -- --phone <phone> --password <password> --name <full name>\n" +
        "(or set SEED_OWNER_PHONE / SEED_OWNER_PASSWORD / SEED_OWNER_NAME)",
    );
    process.exit(1);
  }

  console.log(`Database: ${describeTarget(env.DATABASE_URL)}`);

  const passwordHash = await bcrypt.hash(password, 10);

  // fullNameSearch goes in both branches: it is derived from fullName and must
  // be rewritten wherever the name is, or it goes stale.
  const fullNameSearch = normalizeVi(fullName);

  // Whether this phone already has an account, asked BEFORE the upsert — after
  // it, there is no way to tell the two apart.
  //
  // It matters because the upsert's update branch REPLACES the password. Run
  // against a phone that already exists and the effect is a password reset,
  // which is a reasonable thing to want and a bad thing to do by accident.
  const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } });

  const owner = await prisma.user.upsert({
    where: { phone },
    update: { passwordHash, fullName, fullNameSearch, role: "owner" },
    create: { phone, passwordHash, fullName, fullNameSearch, role: "owner" },
  });

  console.log(
    existing
      ? `Owner account UPDATED: ${owner.phone} (${owner.id}) — the password was replaced`
      : `Owner account created: ${owner.phone} (${owner.id})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
