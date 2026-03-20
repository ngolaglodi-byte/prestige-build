"use client";

import { useEffect, useState } from "react";
import { UserActions, CreateUserForm } from "./UserActions";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Erreur lors du chargement");
        return;
      }
      setUsers(data.users);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Actif</span>;
      case "DISABLED":
        return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Désactivé</span>;
      case "PENDING":
        return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">En attente</span>;
      default:
        return status;
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "ADMIN":
        return <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Admin</span>;
      case "AGENT":
        return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Agent</span>;
      default:
        return role;
    }
  }

  if (loading) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-6">Gestion des utilisateurs</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-6">Gestion des utilisateurs</h1>
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Gestion des utilisateurs</h1>

      <CreateUserForm onCreated={fetchUsers} />

      <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="p-4 text-gray-300">Nom</th>
              <th className="p-4 text-gray-300">E-mail</th>
              <th className="p-4 text-gray-300">Rôle</th>
              <th className="p-4 text-gray-300">Statut</th>
              <th className="p-4 text-gray-300">Dernière connexion</th>
              <th className="p-4 text-gray-300">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-700">
                <td className="p-4 text-white">{u.name ?? "—"}</td>
                <td className="p-4 text-gray-300">{u.email}</td>
                <td className="p-4">{getRoleBadge(u.role)}</td>
                <td className="p-4">{getStatusBadge(u.status)}</td>
                <td className="p-4 text-gray-400 text-sm">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString("fr-FR")
                    : "Jamais"}
                </td>
                <td className="p-4">
                  {u.role !== "ADMIN" && (
                    <UserActions
                      userId={u.id}
                      status={u.status}
                      onRefresh={fetchUsers}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
}
