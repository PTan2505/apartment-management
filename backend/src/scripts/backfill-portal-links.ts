import { prisma } from "@/lib/prisma.js";
import { issueLeasePortalToken } from "@/modules/tenant-portal/service.js";

/**
 * Issues a payment link for every tenancy that has none.
 *
 * Signing a tenancy now issues its link, but every tenancy signed BEFORE that
 * was true has none — and a tenancy with no link is one whose tenant has no way
 * to pay. Run once after the migration; safe to re-run, since it only ever
 * issues for a tenancy holding nothing.
 *
 * Narrow on purpose: a tenancy that already has a usable link is left
 * completely alone. Reissuing would kill a link a tenant may already be
 * holding, which is the one thing this must never do by accident.
 */
async function main() {
  const withoutLink = await prisma.lease.findMany({
    where: { portalTokens: { none: { revokedAt: null } } },
    select: { id: true, reference: true },
    orderBy: { id: "asc" },
  });

  if (withoutLink.length === 0) {
    console.log("Mọi hợp đồng đều đã có link thanh toán — không có gì để làm.");
    return;
  }

  for (const lease of withoutLink) {
    // One transaction per tenancy: a failure part-way leaves the tenancies
    // already done with working links rather than rolling the whole run back.
    await prisma.$transaction((tx) => issueLeasePortalToken(tx, lease.id));
    console.log(`  đã cấp link cho hợp đồng #${lease.id} (${lease.reference ?? "chưa có số"})`);
  }

  console.log(`Đã cấp link cho ${withoutLink.length} hợp đồng.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
