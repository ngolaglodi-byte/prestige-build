import { describe, it, expect } from "vitest";
import { generateSchema, type SchemaTable } from "@/lib/builder/schema-generator";

describe("schema-generator", () => {
  it("generates a schema with serial primary key", () => {
    const tables: SchemaTable[] = [
      {
        name: "users",
        fields: [{ name: "id", type: "serial" }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.path).toBe("db/generated/schema.ts");
    expect(result.content).toContain('serial("id").primaryKey()');
    expect(result.content).toContain('export const users = pgTable("users"');
  });

  it("generates text fields with notNull by default", () => {
    const tables: SchemaTable[] = [
      {
        name: "posts",
        fields: [{ name: "title", type: "text" }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('text("title").notNull()');
  });

  it("generates nullable text fields without notNull", () => {
    const tables: SchemaTable[] = [
      {
        name: "posts",
        fields: [{ name: "bio", type: "text", nullable: true }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('text("bio")');
    expect(result.content).not.toContain('text("bio").notNull()');
  });

  it("generates boolean fields with default false", () => {
    const tables: SchemaTable[] = [
      {
        name: "settings",
        fields: [{ name: "active", type: "boolean" }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('boolean("active").default(false)');
  });

  it("generates timestamp fields with defaultNow", () => {
    const tables: SchemaTable[] = [
      {
        name: "events",
        fields: [{ name: "createdAt", type: "timestamp", defaultNow: true }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('timestamp("createdAt").defaultNow()');
  });

  it("generates timestamp fields without defaultNow", () => {
    const tables: SchemaTable[] = [
      {
        name: "events",
        fields: [{ name: "deletedAt", type: "timestamp" }],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('timestamp("deletedAt")');
    expect(result.content).not.toContain("defaultNow");
  });

  it("generates json and integer fields", () => {
    const tables: SchemaTable[] = [
      {
        name: "data",
        fields: [
          { name: "count", type: "integer" },
          { name: "metadata", type: "json" },
        ],
      },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('integer("count").notNull()');
    expect(result.content).toContain('json("metadata")');
  });

  it("includes drizzle-orm imports", () => {
    const tables: SchemaTable[] = [
      { name: "t", fields: [{ name: "id", type: "serial" }] },
    ];
    const result = generateSchema(tables);
    expect(result.content).toContain('import { pgTable, serial, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core"');
  });
});
