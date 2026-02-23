export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { adminAiConfig } from "@/db/schema";

export default async function AdminAiPage() {
  const providers = await db.select().from(adminAiConfig);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion de l&apos;IA</h1>

      {/* Liste des fournisseurs */}
      <table className="w-full bg-white shadow rounded-lg overflow-hidden mb-8">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Fournisseur</th>
            <th className="p-4">Statut</th>
            <th className="p-4">Priorité</th>
            <th className="p-4">Tokens max</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {providers.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-4 font-semibold">{p.provider}</td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    p.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.enabled ? "Activé" : "Désactivé"}
                </span>
              </td>
              <td className="p-4">{p.priority}</td>
              <td className="p-4">{p.maxTokens.toLocaleString("fr-FR")}</td>
              <td className="p-4">
                <div className="flex gap-2 flex-wrap">
                  {/* Toggle */}
                  <form action="/api/admin/ai/toggle" method="POST">
                    <input type="hidden" name="providerId" value={p.id} />
                    <button
                      type="submit"
                      className={`px-3 py-1 text-white rounded ${
                        p.enabled
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {p.enabled ? "Désactiver" : "Activer"}
                    </button>
                  </form>

                  {/* Update priority & maxTokens */}
                  <form
                    action="/api/admin/ai/update"
                    method="POST"
                    className="flex gap-2 items-center"
                  >
                    <input type="hidden" name="providerId" value={p.id} />
                    <input
                      type="number"
                      name="priority"
                      defaultValue={p.priority}
                      className="border rounded px-2 py-1 w-20"
                      placeholder="Priorité"
                    />
                    <input
                      type="number"
                      name="maxTokens"
                      defaultValue={p.maxTokens}
                      className="border rounded px-2 py-1 w-28"
                      placeholder="Tokens max"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Modifier
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ajouter un fournisseur */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Ajouter un fournisseur IA
        </h2>
        <form
          action="/api/admin/ai/add"
          method="POST"
          className="flex gap-4 items-end flex-wrap"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur
            </label>
            <select
              name="provider"
              className="border rounded px-3 py-2"
              required
            >
              <option value="GPT">GPT</option>
              <option value="Claude">Claude</option>
              <option value="Gemini">Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorité
            </label>
            <input
              type="number"
              name="priority"
              defaultValue={0}
              className="border rounded px-3 py-2 w-24"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tokens max
            </label>
            <input
              type="number"
              name="maxTokens"
              defaultValue={4096}
              className="border rounded px-3 py-2 w-28"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
