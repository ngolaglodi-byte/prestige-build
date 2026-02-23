import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(notifications).where(eq(notifications.id, id));

  return NextResponse.json({ deleted: true });
}
