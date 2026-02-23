export const dynamic = "force-dynamic";

// app/admin/logs/page.tsx
import { db } from "@/db/client";
import { activityLogs, users } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";

export default async function AdminLogsPage() {
  const logs = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
      projectName: projects.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .leftJoin(projects, eq(activityLogs.projectId, projects.id));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Journaux d&apos;activité</h1>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Action</th>
            <th className="p-4">Utilisateur</th>
            <th className="p-4">Projet</th>
            <th className="p-4">Date</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-4">
                <div className="font-semibold">{log.action}</div>
                <div className="text-gray-500 text-sm">
                  {JSON.stringify(log.metadata) ?? "Aucune métadonnée"}
                </div>
              </td>

              <td className="p-4">
                <div>{log.userName ?? "Inconnu"}</div>
                <div className="text-gray-500 text-sm">{log.userEmail}</div>
              </td>

              <td className="p-4">
                {log.projectName ?? "Aucun projet"}
              </td>

              <td className="p-4">
                {new Date(log.createdAt).toLocaleString("fr-FR")}
              </td>

              <td className="p-4">
                <form action="/api/admin/logs/delete" method="POST">
                  <input type="hidden" name="logId" value={log.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
