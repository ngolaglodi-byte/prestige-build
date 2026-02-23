import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const userId = form.get("userId") as string;

  await db
    .update(users)
    .set({ role: "user" })
    .where(eq(users.id, userId));

  return Response.redirect("/admin/users");
}
