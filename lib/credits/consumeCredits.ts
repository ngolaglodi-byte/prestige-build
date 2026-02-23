import { db } from "@/db/client";
import { usageLogs, activityLogs } from "@/db/schema";
import { subscriptions } from "@/db/supabase-schema";
import { eq, sql } from "drizzle-orm";

export async function consumeCredits({
  userId,
  projectId = null,
  credits,
  action,
}: {
  userId: string;
  projectId?: string | null;
  credits: number;
  action: string;
}) {
  if (credits <= 0) {
    throw new Error("Invalid credit amount");
  }

  // Récupérer l'abonnement
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (!sub) {
    throw new Error("Subscription not found");
  }

  if (sub.creditsRemaining < credits) {
    throw new Error("Not enough credits");
  }

  // Décrémenter les crédits
  await db
    .update(subscriptions)
    .set({
      creditsRemaining: sql`${subscriptions.creditsRemaining} - ${credits}`,
    })
    .where(eq(subscriptions.userId, userId));

  // Log dans usageLogs
  await db.insert(usageLogs).values({
    userId,
    projectId,
    tokensUsed: 0, // si tu veux ajouter plus tard
    creditsUsed: credits,
    action,
  });

  // Log dans activityLogs
  await db.insert(activityLogs).values({
    userId,
    projectId,
    action: `credits.consume.${action}`,
    metadata: { credits },
  });

  return true;
}
