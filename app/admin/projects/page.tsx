export const dynamic = "force-dynamic";

// app/admin/projects/page.tsx
import { db } from "@/db/client";
import { users, storageBuckets, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminProjectsPage() {
  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      createdAt: projects.createdAt,
      userId: projects.userId,
      userEmail: users.email,
      userName: users.name,
      storageUsedMb: storageBuckets.storageUsedMb,
      storageLimitMb: storageBuckets.storageLimitMb,
      dbUsedMb: storageBuckets.dbUsedMb,
      dbLimitMb: storageBuckets.dbLimitMb,
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .leftJoin(storageBuckets, eq(projects.id, storageBuckets.projectId));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Gestion des projets</h1>

      <table className="w-full bg-gray-800 shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-left">
          <tr>
            <th className="p-4 text-gray-300">Projet</th>
            <th className="p-4 text-gray-300">Propriétaire</th>
            <th className="p-4 text-gray-300">Stockage</th>
            <th className="p-4 text-gray-300">Créé le</th>
            <th className="p-4 text-gray-300">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allProjects.map((p) => (
            <tr key={p.id} className="border-t border-gray-700">
              <td className="p-4">
                <div className="font-semibold text-white">{p.name}</div>
              </td>

              <td className="p-4">
                <div className="text-white">{p.userName ?? "Inconnu"}</div>
                <div className="text-gray-400 text-sm">{p.userEmail}</div>
              </td>

              <td className="p-4">
                {p.storageLimitMb != null ? (
                  <div className="text-sm text-gray-300">
                    <div>
                      Fichiers : {p.storageUsedMb} / {p.storageLimitMb} Mo
                    </div>
                    <div>
                      BDD : {p.dbUsedMb} / {p.dbLimitMb} Mo
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>

              <td className="p-4 text-gray-300">
                {new Date(p.createdAt).toLocaleDateString("fr-FR")}
              </td>

              <td className="p-4">
                <div className="flex gap-2 flex-wrap">
                  <form action="/api/admin/projects/delete" method="POST">
                    <input type="hidden" name="projectId" value={p.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </form>

                  <form action="/api/admin/projects/reset-quota" method="POST">
                    <input type="hidden" name="projectId" value={p.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Réinitialiser le quota
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {allProjects.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Aucun projet trouvé
        </div>
      )}
    </div>
  );
}
