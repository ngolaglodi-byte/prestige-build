// lib/preview/networkSandbox.ts

/**
 * Construit un environnement "sandbox réseau" pour un process de preview.
 * Ici on prépare les variables d'env pour :
 * - forcer l'usage de localhost
 * - empêcher l'usage de proxy externes
 * - marquer le process comme sandboxé (utile pour durcir plus tard côté infra)
 *
 * NOTE : le vrai blocage réseau (iptables, Docker, etc.)
 * se fera au niveau infra. Ici on structure proprement l'API.
 */

type Env = NodeJS.ProcessEnv;

export function buildNetworkSandboxEnv(
  baseEnv: Env,
  projectId: string
): Env {
  return {
    ...baseEnv,

    // Marqueur clair : process sandboxé
    SANDBOXED: "true",
    SANDBOX_PROJECT_ID: projectId,

    // On désactive tout proxy externe
    HTTP_PROXY: "",
    HTTPS_PROXY: "",
    http_proxy: "",
    https_proxy: "",
    ALL_PROXY: "",
    all_proxy: "",

    // On autorise uniquement localhost en "no proxy"
    NO_PROXY: "localhost,127.0.0.1",
    no_proxy: "localhost,127.0.0.1",

    // Optionnel : durcir TLS (à adapter selon tes besoins)
    NODE_TLS_REJECT_UNAUTHORIZED: "1",
  };
}
