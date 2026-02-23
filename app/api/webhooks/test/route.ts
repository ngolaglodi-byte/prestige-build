import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendWebhook } from "@/lib/webhooks";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const logId = await sendWebhook({
    userId: user.id,
    event: "webhook.test",
    data: {
      message: "Ceci est un événement de test depuis Prestige Build.",
      timestamp: new Date().toISOString(),
    },
  });

  if (!logId) {
    return NextResponse.json(
      { error: "Aucun webhook configuré ou actif." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, logId });
}
