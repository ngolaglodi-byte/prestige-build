import Link from "next/link";

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-white">Tableau de bord administrateur</h1>

      <p className="text-gray-400">
        Bienvenue dans le panneau d&apos;administration de Prestige Build.
      </p>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <Link href="/admin/users" className="p-6 bg-gray-800 shadow rounded-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold text-white">Utilisateurs</h2>
          <p className="text-gray-400">Gérer les utilisateurs (ADMIN / AGENT)</p>
        </Link>

        <Link href="/admin/projects" className="p-6 bg-gray-800 shadow rounded-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold text-white">Projets</h2>
          <p className="text-gray-400">Voir tous les projets</p>
        </Link>

        <Link href="/admin/ai" className="p-6 bg-gray-800 shadow rounded-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold text-white">Intelligence artificielle</h2>
          <p className="text-gray-400">Configurer les fournisseurs IA</p>
        </Link>

        <Link href="/admin/domains" className="p-6 bg-gray-800 shadow rounded-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold text-white">Domaines</h2>
          <p className="text-gray-400">Gérer les domaines et SSL</p>
        </Link>

        <Link href="/admin/logs" className="p-6 bg-gray-800 shadow rounded-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold text-white">Journaux d&apos;audit</h2>
          <p className="text-gray-400">Activité du système</p>
        </Link>
      </div>
    </div>
  );
}
