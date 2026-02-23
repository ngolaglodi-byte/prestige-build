export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import {
  creditPurchases,
  billingEvents,
  users,
} from "@/db/schema";
import { subscriptions } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";

export default async function AdminPaymentsPage() {
  const pawapayPurchases = await db
    .select({
      id: creditPurchases.id,
      creditsAmount: creditPurchases.creditsAmount,
      amountPaid: creditPurchases.amountPaid,
      currency: creditPurchases.currency,
      status: creditPurchases.status,
      createdAt: creditPurchases.createdAt,
      userEmail: users.email,
    })
    .from(creditPurchases)
    .leftJoin(users, eq(creditPurchases.userId, users.id))
    .where(eq(creditPurchases.provider, "pawapay"));

  const failedEvents = await db
    .select({
      id: billingEvents.id,
      provider: billingEvents.provider,
      amount: billingEvents.amount,
      currency: billingEvents.currency,
      status: billingEvents.status,
      createdAt: billingEvents.createdAt,
      userEmail: users.email,
    })
    .from(billingEvents)
    .leftJoin(users, eq(billingEvents.userId, users.id))
    .where(eq(billingEvents.status, "failed"));

  const allSubscriptions = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      renewalDate: subscriptions.renewalDate,
      userName: users.name,
      userEmail: users.email,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion des paiements</h1>

      {/* Transactions PawaPay */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Transactions PawaPay</h2>
        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Crédits</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Devise</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {pawapayPurchases.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-4">{p.userEmail ?? "—"}</td>
                <td className="p-4">{p.creditsAmount}</td>
                <td className="p-4">{p.amountPaid}</td>
                <td className="p-4">{p.currency}</td>
                <td className="p-4 capitalize">{p.status}</td>
                <td className="p-4">
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Paiements échoués */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Paiements échoués</h2>
        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Fournisseur</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Devise</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {failedEvents.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-4">{e.userEmail ?? "—"}</td>
                <td className="p-4">{e.provider}</td>
                <td className="p-4">{e.amount}</td>
                <td className="p-4">{e.currency}</td>
                <td className="p-4">
                  {new Date(e.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Renouvellements d'abonnements */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Renouvellements d&apos;abonnements
        </h2>
        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Date de renouvellement</th>
            </tr>
          </thead>
          <tbody>
            {allSubscriptions.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-4">
                  <div>{s.userName ?? "Inconnu"}</div>
                  <div className="text-gray-500 text-sm">
                    {s.userEmail ?? "—"}
                  </div>
                </td>
                <td className="p-4 capitalize">{s.plan}</td>
                <td className="p-4 capitalize">{s.status}</td>
                <td className="p-4">
                  {s.renewalDate
                    ? new Date(s.renewalDate).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
