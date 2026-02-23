import Link from "next/link";

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Tableau de bord administrateur</h1>

      <p className="text-gray-600">
        Bienvenue dans le panneau d&apos;administration de Prestige Build.
      </p>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <Link href="/admin/users" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Utilisateurs</h2>
          <p className="text-gray-500">Gérer les utilisateurs</p>
        </Link>

        <Link href="/admin/projects" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Projets</h2>
          <p className="text-gray-500">Voir tous les projets</p>
        </Link>

        <Link href="/admin/pricing" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Tarification</h2>
          <p className="text-gray-500">Gérer les prix et les limites</p>
        </Link>

        <Link href="/admin/ai" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Intelligence artificielle</h2>
          <p className="text-gray-500">Configurer les fournisseurs IA</p>
        </Link>

        <Link href="/admin/domains" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Domaines</h2>
          <p className="text-gray-500">Gérer les domaines et SSL</p>
        </Link>

        <Link href="/admin/payments" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Paiements</h2>
          <p className="text-gray-500">Transactions et abonnements</p>
        </Link>

        <Link href="/admin/billing" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Facturation</h2>
          <p className="text-gray-500">Gérer la facturation</p>
        </Link>

        <Link href="/admin/logs" className="p-6 bg-white shadow rounded-lg hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Journaux</h2>
          <p className="text-gray-500">Activité du système</p>
        </Link>
      </div>
    </div>
  );
}
