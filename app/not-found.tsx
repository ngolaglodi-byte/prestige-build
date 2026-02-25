export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-white">
      <div className="max-w-md w-full p-8 bg-surface border border-border rounded-xlSmooth shadow-strong text-center fade-in">
        <div className="text-5xl mb-4">404</div>
        <h2 className="text-xl font-bold mb-2">Page introuvable</h2>
        <p className="text-gray-400 text-sm mb-6">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <a
          href="/"
          className="px-6 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium inline-block"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
