import { db } from "@/db/client";
import {
  subscriptions,
  users,
  adminCreditLogs,
  activityLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId: adminClerkId } = auth();

  if (!adminClerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Récupérer l'admin dans la DB
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, adminClerkId));

  if (!admin || admin.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const targetUserId = form.get("userId") as string;
  const amount = Number(form.get("amount"));
  const reason = (form.get("reason") as string) || "Manual credit addition";

  if (!amount || amount <= 0) {
    return new Response("Invalid amount", { status: 400 });
  }

  // Ajouter les crédits
  await db
    .update(subscriptions)
    .set({
      creditsRemaining: sql`${subscriptions.creditsRemaining} + ${amount}`,
    })
    .where(eq(subscriptions.userId, targetUserId));

  // Enregistrer dans admin_credit_logs
  await db.insert(adminCreditLogs).values({
    adminId: admin.id,
    userId: targetUserId,
    amount,
    reason,
  });

  // Enregistrer dans activity_logs (option premium)
  await db.insert(activityLogs).values({
    userId: admin.id,
    projectId: null,
    action: "admin.add_credits",
    metadata: {
      targetUserId,
      amount,
      reason,
    },
  });

  return Response.redirect("/admin/billing");
}
