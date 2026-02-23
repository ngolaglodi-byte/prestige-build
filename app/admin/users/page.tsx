export const dynamic = "force-dynamic";

// app/admin/users/page.tsx
import { db } from "@/db/client";
import { users, usageLogs } from "@/db/schema";
import { subscriptions } from "@/db/supabase-schema";
import { eq, sql } from "drizzle-orm";
import { PromoteButton, DemoteButton } from "./UserActions";

export default async function AdminUsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: subscriptions.plan,
      subStatus: subscriptions.status,
      totalCreditsUsed: sql<number>`COALESCE(SUM(${usageLogs.creditsUsed}), 0)`.as("total_credits_used"),
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .leftJoin(usageLogs, eq(users.id, usageLogs.userId))
    .groupBy(users.id, subscriptions.plan, subscriptions.status);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion des utilisateurs</h1>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Nom</th>
            <th className="p-4">E-mail</th>
            <th className="p-4">Rôle</th>
            <th className="p-4">Abonnement</th>
            <th className="p-4">Utilisation totale</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allUsers.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-4">{u.name ?? "Aucun nom"}</td>
              <td className="p-4">{u.email}</td>
              <td className="p-4 capitalize">{u.role}</td>
              <td className="p-4">
                {u.plan ? (
                  <span className="capitalize">
                    {u.plan} ({u.subStatus})
                  </span>
                ) : (
                  "Aucun"
                )}
              </td>
              <td className="p-4">{u.totalCreditsUsed} crédits</td>

              <td className="p-4 flex gap-2 flex-wrap">
                {u.role !== "admin" ? (
                  <PromoteButton clerkId={u.clerkId} />
                ) : (
                  <DemoteButton clerkId={u.clerkId} />
                )}

                {u.role !== "suspended" ? (
                  <form action="/api/admin/users/suspend" method="POST">
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Suspendre
                    </button>
                  </form>
                ) : (
                  <form action="/api/admin/users/reactivate" method="POST">
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Réactiver
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
