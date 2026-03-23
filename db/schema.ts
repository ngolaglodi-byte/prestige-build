import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  unique,
  pgEnum,
  inet,
} from "drizzle-orm/pg-core";

// ── USER ROLES ────────────────────────────────────────────────────────────
// Prestige Build interne : ADMIN ou AGENT uniquement
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "AGENT"]);

// ── USER STATUS ───────────────────────────────────────────────────────────
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "DISABLED", "PENDING"]);

// USERS (Authentification locale Prestige Build)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"), // stores plaintext password (no hashing) - nullable for pending accounts
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").notNull().default("AGENT"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// ── SESSIONS ──────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
});

// ── AUDIT LOGS ────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── PROJECTS ──────────────────────────────────────────────────────────────
// Main projects table - now managed by Drizzle for proper migration support
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// DOMAINS
export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // subdomain | custom
  host: varchar("host", { length: 255 }).notNull().unique(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API KEYS
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  label: varchar("label", { length: 255 }),
  revoked: boolean("revoked").notNull().default(false),
  rateLimit: integer("rate_limit").notNull().default(100),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API USAGE TRACKING
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ACTIVITY LOGS
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// STORAGE BUCKETS (project_storage_usage + project_db_usage combined)
export const storageBuckets = pgTable("storage_buckets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  storageUsedMb: integer("storage_used_mb").notNull().default(0),
  storageLimitMb: integer("storage_limit_mb").notNull(),
  dbUsedMb: integer("db_used_mb").notNull().default(0),
  dbLimitMb: integer("db_limit_mb").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PROJECT LIMITS - explicit quota configuration per project
// Audit criteria: allows configurable quotas by project type
export const projectTypeEnum = pgEnum("project_type", [
  "landing",
  "website",
  "webapp",
  "ecommerce",
  "dashboard",
  "saas",
  "api",
  "internal",
]);

export const projectLimits = pgTable("project_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  projectType: projectTypeEnum("project_type").notNull().default("website"),
  dbMinMb: integer("db_min_mb").notNull(),
  dbRecommendedMb: integer("db_recommended_mb").notNull(),
  storageMinMb: integer("storage_min_mb").notNull(),
  storageRecommendedMb: integer("storage_recommended_mb").notNull(),
  scaleFactor: doublePrecision("scale_factor").notNull().default(1.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// EXTERNAL API INTEGRATIONS - for third-party APIs
export const externalApiIntegrations = pgTable("external_api_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 100 }).notNull(), // stripe, sendgrid, twilio, custom, etc.
  protocol: varchar("protocol", { length: 50 }).default("rest"), // rest, graphql, soap, webhook, oauth2, proprietary, custom
  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
  config: jsonb("config").$type<Record<string, string | boolean | number>>().default({}),
  apiKeyHash: varchar("api_key_hash", { length: 255 }), // hashed API key for security
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  testStatus: varchar("test_status", { length: 20 }).default("untested"), // untested | success | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// NOTIFICATIONS
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TEAMS
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TEAM MEMBERS
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TEAM PROJECTS (link projects to teams)
export const teamProjects = pgTable("team_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TEMPLATES
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("Web"),
  tags: jsonb("tags").$type<string[]>().default([]),
  files: jsonb("files").$type<{ path: string; content: string }[]>().notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WEBHOOK CONFIGS
export const webhookConfigs = pgTable("webhook_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpointUrl: text("endpoint_url").notNull(),
  signingSecret: varchar("signing_secret", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WEBHOOK LOGS
export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  webhookConfigId: uuid("webhook_config_id")
    .notNull()
    .references(() => webhookConfigs.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 100 }).notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  payload: jsonb("payload"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  statusCode: integer("status_code"),
  response: text("response"),
  attempt: integer("attempt").notNull().default(1),
  maxAttempts: integer("max_attempts").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// INTEGRATIONS
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // github | vercel | supabase | webhooks
  active: boolean("active").notNull().default(false),
  config: jsonb("config").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ADMIN AI CONFIG
export const adminAiConfig = pgTable("admin_ai_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  maxTokens: integer("max_tokens").notNull().default(4096),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FILES (project files)
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.projectId, t.path),
]);

// PREVIEW SESSIONS
export const previewSessions = pgTable("preview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  port: integer("port").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  cpuPercent: doublePrecision("cpu_percent"),
  memoryMb: doublePrecision("memory_mb"),
  startedAt: timestamp("started_at"),
  stoppedAt: timestamp("stopped_at"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// BUILDS
export const builds = pgTable("builds", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  target: text("target").notNull(),
  status: text("status").notNull().default("queued"),
  progress: integer("progress").default(0),
  artifactUrl: text("artifact_url"),
  artifactSize: integer("artifact_size"),
  config: jsonb("config"),
  logs: text("logs"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── SHOWCASE ──────────────────────────────────────────────────────────────

export const showcaseStatusEnum = pgEnum("showcase_status", [
  "pending",
  "approved",
  "rejected",
]);

// SHOWCASE PROJECTS — public gallery entries
export const showcaseProjects = pgTable("showcase_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 255 }),
  thumbnailUrl: text("thumbnail_url"),
  liveUrl: text("live_url"),
  repoUrl: text("repo_url"),
  category: varchar("category", { length: 50 }).notNull().default("other"),
  tags: jsonb("tags").$type<string[]>().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  featured: boolean("featured").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  views: integer("views").notNull().default(0),
  remixCount: integer("remix_count").notNull().default(0),
  status: showcaseStatusEnum("status").notNull().default("pending"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// SHOWCASE LIKES — one like per user per showcase entry
export const showcaseLikes = pgTable(
  "showcase_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showcaseId: uuid("showcase_id")
      .notNull()
      .references(() => showcaseProjects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.showcaseId, t.userId)]
);

// SHOWCASE COMMENTS
export const showcaseComments = pgTable("showcase_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  showcaseId: uuid("showcase_id")
    .notNull()
    .references(() => showcaseProjects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── CONVERSATION SESSIONS ─────────────────────────────────────────────────

export const conversationPhaseEnum = pgEnum("conversation_phase", [
  "gathering",
  "planning",
  "generating",
  "reviewing",
  "modifying",
  "completed",
]);

export const conversationSessions = pgTable("conversation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phase: conversationPhaseEnum("phase").notNull().default("gathering"),
  requirements: jsonb("requirements").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── AGENT PLANS ───────────────────────────────────────────────────────────

export const agentPlanStatusEnum = pgEnum("agent_plan_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const agentPlans = pgTable("agent_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: text("goal").notNull(),
  status: agentPlanStatusEnum("status").notNull().default("pending"),
  steps: jsonb("steps").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ── GITHUB SYNC CONFIGS ───────────────────────────────────────────────────

export const githubSyncDirectionEnum = pgEnum("github_sync_direction", [
  "push",
  "pull",
  "both",
]);

export const githubSyncConfigs = pgTable("github_sync_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  owner: varchar("owner", { length: 255 }).notNull(),
  repo: varchar("repo", { length: 255 }).notNull(),
  branch: varchar("branch", { length: 255 }).notNull().default("main"),
  direction: githubSyncDirectionEnum("direction").notNull().default("both"),
  autoSync: boolean("auto_sync").notNull().default(false),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastCommitSha: varchar("last_commit_sha", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── DEPLOYMENT ENVIRONMENTS ───────────────────────────────────────────────

export const envTypeEnum = pgEnum("env_type", [
  "development",
  "preview",
  "production",
]);

export const envStatusEnum = pgEnum("env_status", [
  "active",
  "building",
  "deploying",
  "failed",
  "stopped",
]);

export const deploymentEnvironments = pgTable("deployment_environments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: envTypeEnum("type").notNull(),
  status: envStatusEnum("status").notNull().default("stopped"),
  url: text("url"),
  branch: varchar("branch", { length: 255 }),
  commitSha: varchar("commit_sha", { length: 255 }),
  variables: jsonb("variables").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deployedAt: timestamp("deployed_at", { withTimezone: true }),
});

// ── MARKETPLACE FAVORITES ─────────────────────────────────────────────────

export const marketplaceFavorites = pgTable(
  "marketplace_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showcaseId: uuid("showcase_id")
      .notNull()
      .references(() => showcaseProjects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.showcaseId, t.userId)]
);
