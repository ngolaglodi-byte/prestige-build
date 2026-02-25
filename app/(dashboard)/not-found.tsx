export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-white">
      <div className="max-w-md w-full p-8 bg-surface border border-border rounded-xlSmooth shadow-strong text-center fade-in">
        <div className="text-5xl mb-4">404</div>
        <h2 className="text-xl font-bold mb-2">Page introuvable</h2>
        <p className="text-gray-400 text-sm mb-6">
          Cette section du tableau de bord n&apos;existe pas.
        </p>
        <a
          href="/dashboard"
          className="px-6 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium inline-block"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}
