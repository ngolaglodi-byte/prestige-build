export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { adminPricingConfig } from "@/db/schema";

const defaults: Record<string, object> = {
  base_price: { usd: 9.99 },
  plan_limits: {
    Free: { projects: 1, storage_mb: 500, db_mb: 100 },
    Pro: { projects: 10, storage_mb: 5000, db_mb: 1000 },
    Business: { projects: 50, storage_mb: 20000, db_mb: 5000 },
    Enterprise: { projects: -1, storage_mb: 100000, db_mb: 50000 },
  },
  ai_quotas: {
    Free: { tokens: 10000 },
    Pro: { tokens: 100000 },
    Business: { tokens: 500000 },
    Enterprise: { tokens: -1 },
  },
  workspace_quotas: {
    Free: { members: 1 },
    Pro: { members: 5 },
    Business: { members: 25 },
    Enterprise: { members: -1 },
  },
};

const labels: Record<string, string> = {
  base_price: "Prix de base (USD)",
  plan_limits: "Limites par plan",
  ai_quotas: "Quotas IA par plan",
  workspace_quotas: "Quotas espace de travail par plan",
};

export default async function AdminPricingPage() {
  const configs = await db.select().from(adminPricingConfig);
  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const keys = ["base_price", "plan_limits", "ai_quotas", "workspace_quotas"];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion de la tarification</h1>

      <div className="space-y-8">
        {keys.map((key) => {
          const currentValue = configMap[key] ?? defaults[key];
          return (
            <div key={key} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{labels[key]}</h2>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Valeur actuelle
                </h3>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(currentValue, null, 2)}
                </pre>
              </div>

              <form action="/api/admin/pricing/update" method="POST">
                <input type="hidden" name="key" value={key} />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouvelle valeur (JSON)
                </label>
                <textarea
                  name="value"
                  rows={4}
                  defaultValue={JSON.stringify(currentValue, null, 2)}
                  className="w-full border rounded p-2 font-mono text-sm mb-3"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
