export const dynamic = "force-dynamic";

// app/admin/users/page.tsx
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Role</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allUsers.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-4">{u.name ?? "No name"}</td>
              <td className="p-4">{u.email}</td>
              <td className="p-4 capitalize">{u.role}</td>

              <td className="p-4 flex gap-3">
                {u.role !== "admin" ? (
                  <form action={`/api/admin/promote`} method="POST">
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Promote to Admin
                    </button>
                  </form>
                ) : (
                  <form action={`/api/admin/demote`} method="POST">
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove Admin
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
