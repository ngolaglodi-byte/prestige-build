export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { adminAiConfig } from "@/db/schema";

export default async function AdminAiPage() {
  const providers = await db.select().from(adminAiConfig);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Gestion de l&apos;IA</h1>

      {/* Liste des fournisseurs */}
      <table className="w-full bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <thead className="bg-gray-700 text-left">
          <tr>
            <th className="p-4 text-gray-300">Fournisseur</th>
            <th className="p-4 text-gray-300">Statut</th>
            <th className="p-4 text-gray-300">Priorité</th>
            <th className="p-4 text-gray-300">Tokens max</th>
            <th className="p-4 text-gray-300">Actions</th>
          </tr>
        </thead>

        <tbody>
          {providers.map((p) => (
            <tr key={p.id} className="border-t border-gray-700">
              <td className="p-4 font-semibold text-white">{p.provider}</td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    p.enabled
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {p.enabled ? "Activé" : "Désactivé"}
                </span>
              </td>
              <td className="p-4 text-gray-300">{p.priority}</td>
              <td className="p-4 text-gray-300">{p.maxTokens.toLocaleString("fr-FR")}</td>
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
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-20 text-white"
                      placeholder="Priorité"
                    />
                    <input
                      type="number"
                      name="maxTokens"
                      defaultValue={p.maxTokens}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-28 text-white"
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

      {providers.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Aucun fournisseur IA configuré
        </div>
      )}

      {/* Ajouter un fournisseur */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Ajouter un fournisseur IA
        </h2>
        <form
          action="/api/admin/ai/add"
          method="POST"
          className="flex gap-4 items-end flex-wrap"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fournisseur
            </label>
            <select
              name="provider"
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              required
            >
              <option value="GPT">GPT</option>
              <option value="Claude">Claude</option>
              <option value="Gemini">Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Priorité
            </label>
            <input
              type="number"
              name="priority"
              defaultValue={0}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-24 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tokens max
            </label>
            <input
              type="number"
              name="maxTokens"
              defaultValue={4096}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-28 text-white"
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
