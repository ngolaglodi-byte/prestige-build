export const dynamic = "force-dynamic";
export default function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <p className="text-gray-600">
        Bienvenue dans le panneau d'administration de Prestige Build.
      </p>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-gray-500">Gérer les utilisateurs</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-gray-500">Voir tous les projets</p>
        </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold">Logs</h2>
          <p className="text-gray-500">Activité du système</p>
        </div>
      </div>
    </div>
  );
}
