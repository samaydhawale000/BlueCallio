import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subscriptions = await prisma.subscription.findMany({
    where: { currentPeriodStart: { not: null } },
  });

  let merged = 0;
  let repointed = 0;

  for (const sub of subscriptions) {
    const anchorStart = sub.currentPeriodStart!;
    const calendarStart = new Date(anchorStart.getFullYear(), anchorStart.getMonth(), 1);

    if (calendarStart.getTime() === anchorStart.getTime()) {
      // Anchor day already the 1st — nothing to merge for this cycle.
      continue;
    }

    const [anchorRow, calendarRow] = await Promise.all([
      prisma.usage.findUnique({
        where: {
          companyId_billingCycleStart: {
            companyId: sub.companyId,
            billingCycleStart: anchorStart,
          },
        },
      }),
      prisma.usage.findUnique({
        where: {
          companyId_billingCycleStart: {
            companyId: sub.companyId,
            billingCycleStart: calendarStart,
          },
        },
      }),
    ]);

    if (!calendarRow) continue; // nothing to merge

    if (!anchorRow) {
      // Only the calendar-month row exists — just repoint it onto the
      // anchor key (safe: no collision, it's the sole row for this user).
      await prisma.usage.update({
        where: { id: calendarRow.id },
        data: {
          billingCycleStart: anchorStart,
          billingCycleEnd: sub.currentPeriodEnd ?? calendarRow.billingCycleEnd,
        },
      });
      repointed++;
      console.log(`Repointed calendar-month Usage row for ${sub.companyId} onto anchor cycle.`);
      continue;
    }

    // Both exist — merge calendarRow into anchorRow, then delete calendarRow.
    await prisma.$transaction([
      prisma.usage.update({
        where: { id: anchorRow.id },
        data: {
          minutesUsed: anchorRow.minutesUsed + calendarRow.minutesUsed,
          minutesPurchased: anchorRow.minutesPurchased + calendarRow.minutesPurchased,
          callsCreated: anchorRow.callsCreated + calendarRow.callsCreated,
          callsCompleted: anchorRow.callsCompleted + calendarRow.callsCompleted,
          participants: anchorRow.participants + calendarRow.participants,
          apiRequests: anchorRow.apiRequests + calendarRow.apiRequests,
          audioMinutes: anchorRow.audioMinutes + calendarRow.audioMinutes,
          videoMinutes: anchorRow.videoMinutes + calendarRow.videoMinutes,
          screenShareMinutes: anchorRow.screenShareMinutes + calendarRow.screenShareMinutes,
          usageCostPaise: anchorRow.usageCostPaise + calendarRow.usageCostPaise,
        },
      }),
      prisma.callUsage.updateMany({
        where: { usageId: calendarRow.id },
        data: { usageId: anchorRow.id },
      }),
      prisma.usage.delete({ where: { id: calendarRow.id } }),
    ]);
    merged++;
    console.log(`Merged duplicate Usage rows for ${sub.companyId} (anchor ${anchorStart.toISOString()}).`);
  }

  console.log(`Done. Merged: ${merged}, repointed: ${repointed}, subscriptions scanned: ${subscriptions.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
