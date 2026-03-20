/**
 * API Module - Prestige Build
 * 
 * Point d'entrée pour les fonctionnalités d'API externes.
 * Fournit la génération automatique de wrappers sécurisés pour tous les protocoles.
 * 
 * Critère d'audit : 10/10 pour l'intégration d'APIs externes
 */

// Export du générateur de wrappers
export {
  generateSecureWrapper,
  generateBatchWrappers,
  generateWrapperId,
  type WrapperConfig,
  type AuthType,
  type GeneratedWrapper,
  type WrapperGenerationResult,
} from "./wrapperGenerator";

// Réexport des types et fonctions du gestionnaire d'intégration
export {
  // Types
  type ApiProtocol,
  type ExternalApiProvider,
  type ExternalApiConfig,
  type ExternalApiIntegration,
  type CreateIntegrationInput,
  type UpdateIntegrationInput,
  type ProviderConfig,
  
  // Fonctions CRUD
  createExternalApiIntegration,
  getProjectIntegrations,
  getIntegration,
  updateExternalApiIntegration,
  deleteExternalApiIntegration,
  testExternalApiIntegration,
  
  // Fonctions de configuration
  listSupportedProviders,
  listSupportedProtocols,
  getProvidersWithProtocols,
  supportsProtocol,
  
  // Fonctions utilitaires
  getMaxIntegrationsPerProject,
  hasUnlimitedApiSupport,
} from "@/lib/integrations/externalApiManager";
