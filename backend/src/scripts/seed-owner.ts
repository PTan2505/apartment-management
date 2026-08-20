import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma.js";
import { normalizeVi } from "@/lib/normalize-vi.js";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
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

  const passwordHash = await bcrypt.hash(password, 10);

  // fullNameSearch goes in both branches: it is derived from fullName and must
  // be rewritten wherever the name is, or it goes stale.
  const fullNameSearch = normalizeVi(fullName);

  const owner = await prisma.user.upsert({
    where: { phone },
    update: { passwordHash, fullName, fullNameSearch, role: "owner" },
    create: { phone, passwordHash, fullName, fullNameSearch, role: "owner" },
  });

  console.log(`Owner account ready: ${owner.phone} (${owner.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
