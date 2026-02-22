export const dynamic = "force-dynamic";
// app/admin/billing/page.tsx
import { db } from "@/db/client";
import {
  subscriptions,
  users,
  creditPurchases,
  billingEvents,
  adminCreditLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminBillingPage() {
  // Subscriptions
  const allSubscriptions = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      creditsMonthly: subscriptions.creditsMonthly,
      creditsRemaining: subscriptions.creditsRemaining,
      status: subscriptions.status,
      renewalDate: subscriptions.renewalDate,
      userName: users.name,
      userEmail: users.email,
      userId: users.id,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id));

  // Credit Purchases
  const purchases = await db
    .select({
      id: creditPurchases.id,
      creditsAmount: creditPurchases.creditsAmount,
      amountPaid: creditPurchases.amountPaid,
      currency: creditPurchases.currency,
      provider: creditPurchases.provider,
      status: creditPurchases.status,
      createdAt: creditPurchases.createdAt,
      userEmail: users.email,
    })
    .from(creditPurchases)
    .leftJoin(users, eq(creditPurchases.userId, users.id));

  // Billing Events
  const events = await db
    .select({
      id: billingEvents.id,
      amount: billingEvents.amount,
      currency: billingEvents.currency,
      provider: billingEvents.provider,
      status: billingEvents.status,
      createdAt: billingEvents.createdAt,
      userEmail: users.email,
    })
    .from(billingEvents)
    .leftJoin(users, eq(billingEvents.userId, users.id));

  // Admin Credit Logs
  const creditLogs = await db
    .select({
      id: adminCreditLogs.id,
      amount: adminCreditLogs.amount,
      reason: adminCreditLogs.reason,
      createdAt: adminCreditLogs.createdAt,
      adminName: users.name,
      adminEmail: users.email,
      targetName: users.name,
    })
    .from(adminCreditLogs)
    .leftJoin(users, eq(adminCreditLogs.adminId, users.id))
    .leftJoin(users, eq(adminCreditLogs.userId, users.id));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Billing & Subscriptions</h1>

      {/* SUBSCRIPTIONS */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Subscriptions</h2>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden mb-10">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">User</th>
            <th className="p-4">Plan</th>
            <th className="p-4">Credits</th>
            <th className="p-4">Status</th>
            <th className="p-4">Renewal</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allSubscriptions.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-4">
                <div>{s.userName ?? "Unknown"}</div>
                <div className="text-gray-500 text-sm">{s.userEmail}</div>
              </td>

              <td className="p-4 capitalize">{s.plan}</td>

              <td className="p-4">
                {s.creditsRemaining} / {s.creditsMonthly}
              </td>

              <td className="p-4 capitalize">{s.status}</td>

              <td className="p-4">
                {s.renewalDate
                  ? new Date(s.renewalDate).toLocaleDateString()
                  : "—"}
              </td>

              <td className="p-4 flex gap-3 items-center">
                {/* Add Credits */}
                {s.userId && (
                <form
                  action="/api/admin/billing/add-credits"
                  method="POST"
                  className="flex gap-2 items-center"
                >
                  <input type="hidden" name="userId" value={s.userId} />

                  <input
                    type="number"
                    name="amount"
                    placeholder="Credits"
                    className="w-24 px-2 py-1 border rounded"
                    required
                    min="1"
                  />

                  <input
                    type="text"
                    name="reason"
                    placeholder="Reason"
                    className="px-2 py-1 border rounded w-48"
                  />

                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </form>
                )}

                {/* Suspend */}
                {s.status !== "suspended" && (
                  <form action="/api/admin/billing/suspend" method="POST">
                    <input type="hidden" name="subId" value={s.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Suspend
                    </button>
                  </form>
                )}

                {/* Reactivate */}
                {s.status === "suspended" && (
                  <form action="/api/admin/billing/reactivate" method="POST">
                    <input type="hidden" name="subId" value={s.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Reactivate
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREDIT PURCHASES */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Credit Purchases</h2>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden mb-10">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">User</th>
            <th className="p-4">Credits</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Provider</th>
            <th className="p-4">Status</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>

        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-4">{p.userEmail}</td>
              <td className="p-4">{p.creditsAmount}</td>
              <td className="p-4">
                {p.amountPaid} {p.currency}
              </td>
              <td className="p-4 capitalize">{p.provider}</td>
              <td className="p-4 capitalize">{p.status}</td>
              <td className="p-4">
                {new Date(p.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* BILLING EVENTS */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Billing Events</h2>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden mb-10">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">User</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Provider</th>
            <th className="p-4">Status</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>

        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-4">{e.userEmail}</td>
              <td className="p-4">
                {e.amount} {e.currency}
              </td>
              <td className="p-4 capitalize">{e.provider}</td>
              <td className="p-4 capitalize">{e.status}</td>
              <td className="p-4">
                {new Date(e.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADMIN CREDIT LOGS */}
      <h2 className="text-2xl font-semibold mt-12 mb-4">Admin Credit History</h2>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Admin</th>
            <th className="p-4">User</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Reason</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>

        <tbody>
          {creditLogs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-4">
                <div>{log.adminName}</div>
                <div className="text-gray-500 text-sm">{log.adminEmail}</div>
              </td>

              <td className="p-4">{log.targetName}</td>

              <td className="p-4 font-semibold text-blue-600">+{log.amount}</td>

              <td className="p-4">{log.reason}</td>

              <td className="p-4">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
