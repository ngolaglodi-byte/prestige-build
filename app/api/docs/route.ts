import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Prestige Build API",
    description: "API de la plateforme Prestige Build — génération de code IA, projets, équipes, facturation.",
    version: "0.1.0",
  },
  servers: [
    { url: "http://localhost:3000", description: "Développement" },
  ],
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service en bonne santé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    status: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string" },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/me": {
      get: {
        summary: "Obtenir l'utilisateur courant",
        tags: ["User"],
        security: [{ clerk: [] }],
        responses: {
          "200": { description: "Données utilisateur" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/projects/list": {
      get: {
        summary: "Lister les projets",
        tags: ["Projects"],
        security: [{ clerk: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 6 } },
        ],
        responses: {
          "200": { description: "Liste des projets" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/projects/create": {
      post: {
        summary: "Créer un projet",
        tags: ["Projects"],
        security: [{ clerk: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  framework: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Projet créé" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/ai": {
      post: {
        summary: "Générer du code avec l'IA",
        tags: ["AI"],
        security: [{ clerk: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: { type: "string" },
                  action: { type: "string", enum: ["generate", "generate_multi", "refactor", "explain", "fix", "create_project"] },
                  model: { type: "string", enum: ["claude", "gemini", "gpt"] },
                  code: { type: "string" },
                  filePath: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Code généré" },
          "401": { description: "Non autorisé" },
          "422": { description: "Entrée invalide" },
          "429": { description: "Trop de requêtes" },
        },
      },
    },
    "/api/teams": {
      get: {
        summary: "Lister les équipes",
        tags: ["Teams"],
        security: [{ clerk: [] }],
        responses: {
          "200": { description: "Liste des équipes" },
        },
      },
    },
    "/api/billing": {
      get: {
        summary: "Obtenir les informations de facturation",
        tags: ["Billing"],
        security: [{ clerk: [] }],
        responses: {
          "200": { description: "Informations de facturation" },
        },
      },
    },
    "/api/templates": {
      get: {
        summary: "Lister les templates",
        tags: ["Templates"],
        security: [{ clerk: [] }],
        responses: {
          "200": { description: "Liste des templates" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      clerk: {
        type: "http",
        scheme: "bearer",
        description: "Clerk JWT token",
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
