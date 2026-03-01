export const dynamic = "force-dynamic";

// app/admin/overview/page.tsx
import { db } from "@/db/client";
import { users, activityLogs } from "@/db/schema";
import { projects, subscriptions } from "@/db/supabase-schema";
import { sql } from "drizzle-orm";

export default async function AdminOverviewPage() {
  // Total users
  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users);

  // Total projects
  const [{ count: totalProjects }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(projects);

  // Total logs
  const [{ count: totalLogs }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(activityLogs);

  // Total credits remaining — with COALESCE to handle empty table
  let creditsRemaining = 0;
  let creditsMonthly = 0;

  try {
    const creditsResult = await db
      .select({
        remaining: sql<number>`COALESCE(SUM(${subscriptions.creditsRemaining}), 0)`,
        monthly: sql<number>`COALESCE(SUM(${subscriptions.creditsMonthly}), 0)`,
      })
      .from(subscriptions);

    creditsRemaining = Number(creditsResult[0]?.remaining ?? 0);
    creditsMonthly = Number(creditsResult[0]?.monthly ?? 0);
  } catch (error) {
    console.error("[AdminOverview] Failed to query subscriptions:", error);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vue d&apos;ensemble</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Utilisateurs</h2>
          <p className="text-4xl font-bold mt-2">{totalUsers}</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Projets</h2>
          <p className="text-4xl font-bold mt-2">{totalProjects}</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Journaux d&apos;activité</h2>
          <p className="text-4xl font-bold mt-2">{totalLogs}</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Crédits restants</h2>
          <p className="text-4xl font-bold mt-2">{creditsRemaining}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Total des crédits mensuels alloués</h2>
          <p className="text-4xl font-bold mt-2">{creditsMonthly}</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Taux d&apos;utilisation des crédits</h2>
          <p className="text-4xl font-bold mt-2">
            {creditsMonthly > 0
              ? `${Math.round(
                  ((creditsMonthly - creditsRemaining) / creditsMonthly) * 100
                )}%`
              : "0%"}
          </p>
        </div>
      </div>
    </div>
  );
}
