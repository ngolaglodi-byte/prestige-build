import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { domains } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCnameTarget } from "@/lib/deploy/domainUtils";
import { resolve } from "dns/promises";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: "ID du domaine requis" }, { status: 400 });
  }

  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 });
  }

  if (domain.type === "subdomain") {
    return NextResponse.json({ verified: true, message: "Sous-domaine auto-vérifié" });
  }

  // Verify DNS CNAME record
  const cnameTarget = getCnameTarget();
  let verified = false;
  let message = "";

  try {
    const records = await resolve(domain.host, "CNAME");
    const match = records.some(
      (r) => r.replace(/\.$/, "").toLowerCase() === cnameTarget.toLowerCase()
    );
    if (match) {
      verified = true;
      message = "DNS vérifié avec succès";
    } else {
      message = `CNAME trouvé mais ne pointe pas vers ${cnameTarget}`;
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      message = `Aucun enregistrement CNAME trouvé pour ${domain.host}. Ajoutez un CNAME pointant vers ${cnameTarget}`;
    } else {
      message = `Erreur lors de la vérification DNS. Veuillez réessayer plus tard.`;
    }
  }

  if (verified) {
    await db
      .update(domains)
      .set({ verified: true })
      .where(eq(domains.id, domainId));
  }

  return NextResponse.json({ verified, message });
}
