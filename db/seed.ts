import "dotenv/config";
import { db } from "./client";
import { users } from "./schema";
import { subscriptions } from "./supabase-schema";

async function seed() {
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        plan: "free",
        creditsMonthly: 20,
        creditsRemaining: 20,
        storageLimitMb: 100,
        dbLimitMb: 50,
        priceUsd: 0,
        status: "active",
      })
      .onConflictDoNothing({ target: subscriptions.userId });
  }

  console.log("Seed terminé.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
