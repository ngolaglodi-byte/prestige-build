/**
 * Generates Drizzle ORM schemas from AI output.
 */

import type { GeneratedFile } from "./template-engine";

export interface SchemaField {
  name: string;
  type: "text" | "integer" | "boolean" | "timestamp" | "serial" | "json";
  nullable?: boolean;
  defaultNow?: boolean;
}

export interface SchemaTable {
  name: string;
  fields: SchemaField[];
}

function drizzleType(field: SchemaField): string {
  switch (field.type) {
    case "serial":
      return `serial("${field.name}").primaryKey()`;
    case "text":
      return `text("${field.name}")${field.nullable ? "" : ".notNull()"}`;
    case "integer":
      return `integer("${field.name}")${field.nullable ? "" : ".notNull()"}`;
    case "boolean":
      return `boolean("${field.name}").default(false)`;
    case "timestamp":
      return `timestamp("${field.name}")${field.defaultNow ? ".defaultNow()" : ""}`;
    case "json":
      return `json("${field.name}")`;
    default:
      return `text("${field.name}")`;
  }
}

export function generateSchema(tables: SchemaTable[]): GeneratedFile {
  const imports = `import { pgTable, serial, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";\n\n`;

  const tableDefs = tables
    .map((t) => {
      const fields = t.fields.map((f) => `  ${f.name}: ${drizzleType(f)},`).join("\n");
      return `export const ${t.name} = pgTable("${t.name}", {\n${fields}\n});`;
    })
    .join("\n\n");

  return {
    path: "db/generated/schema.ts",
    content: imports + tableDefs + "\n",
  };
}
