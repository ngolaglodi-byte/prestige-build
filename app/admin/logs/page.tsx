export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { auditLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export default async function AdminLogsPage() {
  const targetUsers = alias(users, "targetUsers");
  
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
      targetName: targetUsers.name,
      targetEmail: targetUsers.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .leftJoin(targetUsers, eq(auditLogs.targetUserId, targetUsers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  function getActionLabel(action: string): { label: string; color: string } {
    switch (action) {
      case "login_success":
        return { label: "Connexion réussie", color: "text-green-400" };
      case "login_fail":
        return { label: "Échec de connexion", color: "text-red-400" };
      case "logout":
        return { label: "Déconnexion", color: "text-blue-400" };
      case "user_create":
        return { label: "Création utilisateur", color: "text-purple-400" };
      case "user_activate":
        return { label: "Activation utilisateur", color: "text-green-400" };
      case "user_deactivate":
        return { label: "Désactivation utilisateur", color: "text-orange-400" };
      case "user_reset_password":
        return { label: "Réinitialisation MDP", color: "text-yellow-400" };
      case "password_change":
        return { label: "Changement MDP", color: "text-blue-400" };
      case "build_start":
        return { label: "Démarrage build", color: "text-cyan-400" };
      case "build_stop":
        return { label: "Arrêt build", color: "text-gray-400" };
      default:
        return { label: action, color: "text-gray-400" };
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Journaux d&apos;audit</h1>

      <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="p-4 text-gray-300">Action</th>
              <th className="p-4 text-gray-300">Acteur</th>
              <th className="p-4 text-gray-300">Cible</th>
              <th className="p-4 text-gray-300">Métadonnées</th>
              <th className="p-4 text-gray-300">Date</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => {
              const { label, color } = getActionLabel(log.action);
              return (
                <tr key={log.id} className="border-t border-gray-700">
                  <td className="p-4">
                    <span className={`font-semibold ${color}`}>{label}</span>
                  </td>

                  <td className="p-4">
                    <div className="text-white">{log.actorName ?? "Système"}</div>
                    <div className="text-gray-500 text-sm">{log.actorEmail ?? "—"}</div>
                  </td>

                  <td className="p-4">
                    {log.targetName ? (
                      <>
                        <div className="text-white">{log.targetName}</div>
                        <div className="text-gray-500 text-sm">{log.targetEmail}</div>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>

                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            Aucun journal d&apos;audit
          </div>
        )}
      </div>
    </div>
  );
}
