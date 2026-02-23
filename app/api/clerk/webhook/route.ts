import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return new Response("Missing Clerk webhook signing secret", { status: 500 });
  }

  const wh = new Webhook(SIGNING_SECRET);
  const payload = await req.text();
  const headerPayload = headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: Record<string, any> };

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as { type: string; data: Record<string, any> };
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = event;

  const email = data.email_addresses?.[0]?.email_address ?? null;
  const name = data.first_name ?? "User";
  // avatar available via data.image_url

  // ---------------------------------------------------------
  // USER CREATED
  // ---------------------------------------------------------
  if (type === "user.created") {
    console.log("👤 Creating user:", data.id);

    await prisma.user.create({
      data: {
        id: data.id,
        email,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),

        // Assignation automatique du plan FREE
        userPlan: {
          create: {
            plan: {
              connect: { slug: "free" }
            }
          }
        },

        // Limites par défaut (comme Lovable)
        limits: {
          create: {
            maxActivePreviews: 1,
            maxCpuPercent: 20,
            maxMemoryMb: 256
          }
        }
      }
    });

    console.log("✅ User created with FREE plan");
  }

  // ---------------------------------------------------------
  // USER UPDATED
  // ---------------------------------------------------------
  if (type === "user.updated") {
    console.log("🔄 Updating user:", data.id);

    await prisma.user.update({
      where: { id: data.id },
      data: {
        email,
        name,
        updatedAt: new Date(),
      }
    });

    console.log("✅ User updated");
  }

  // ---------------------------------------------------------
  // USER DELETED
  // ---------------------------------------------------------
  if (type === "user.deleted") {
    console.log("🗑️ Deleting user:", data.id);

    await prisma.user.delete({
      where: { id: data.id }
    });

    console.log("✅ User deleted");
  }

  return new Response("Webhook processed", { status: 200 });
}
