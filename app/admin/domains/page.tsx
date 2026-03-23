export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { domains, users, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminDomainsPage() {
  const allDomains = await db
    .select({
      id: domains.id,
      host: domains.host,
      type: domains.type,
      verified: domains.verified,
      createdAt: domains.createdAt,
      projectName: projects.name,
      ownerEmail: users.email,
    })
    .from(domains)
    .leftJoin(projects, eq(domains.projectId, projects.id))
    .leftJoin(users, eq(projects.userId, users.id));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Gestion des domaines</h1>

      <table className="w-full bg-gray-800 shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-left">
          <tr>
            <th className="p-4 text-gray-300">Hôte</th>
            <th className="p-4 text-gray-300">Type</th>
            <th className="p-4 text-gray-300">Vérifié</th>
            <th className="p-4 text-gray-300">Projet</th>
            <th className="p-4 text-gray-300">Propriétaire</th>
            <th className="p-4 text-gray-300">Créé le</th>
            <th className="p-4 text-gray-300">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allDomains.map((d) => (
            <tr key={d.id} className="border-t border-gray-700">
              <td className="p-4 font-semibold text-white">{d.host}</td>
              <td className="p-4 capitalize text-gray-300">{d.type}</td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    d.verified
                      ? "bg-green-600 text-white"
                      : "bg-yellow-600 text-white"
                  }`}
                >
                  {d.verified ? "Oui" : "Non"}
                </span>
              </td>
              <td className="p-4 text-gray-300">{d.projectName ?? "—"}</td>
              <td className="p-4 text-gray-300">{d.ownerEmail ?? "—"}</td>
              <td className="p-4 text-gray-300">
                {new Date(d.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <form action="/api/admin/domains/verify" method="POST">
                    <input type="hidden" name="domainId" value={d.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Vérifier DNS
                    </button>
                  </form>

                  <form action="/api/admin/domains/ssl" method="POST">
                    <input type="hidden" name="domainId" value={d.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Régénérer SSL
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {allDomains.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Aucun domaine configuré
        </div>
      )}
    </div>
  );
}
