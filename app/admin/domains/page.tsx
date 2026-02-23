export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { domains, projects, users } from "@/db/schema";
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
      <h1 className="text-3xl font-bold mb-6">Gestion des domaines</h1>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Hôte</th>
            <th className="p-4">Type</th>
            <th className="p-4">Vérifié</th>
            <th className="p-4">Projet</th>
            <th className="p-4">Propriétaire</th>
            <th className="p-4">Créé le</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allDomains.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-4 font-semibold">{d.host}</td>
              <td className="p-4 capitalize">{d.type}</td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    d.verified
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {d.verified ? "Oui" : "Non"}
                </span>
              </td>
              <td className="p-4">{d.projectName ?? "—"}</td>
              <td className="p-4">{d.ownerEmail ?? "—"}</td>
              <td className="p-4">
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
    </div>
  );
}
