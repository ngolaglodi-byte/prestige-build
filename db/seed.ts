import "dotenv/config";
import { db } from "./client";
import { users } from "./schema";

async function seed() {
  const allUsers = await db.select().from(users);

  console.log(`Found ${allUsers.length} users in database.`);
  console.log("Seed terminé.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
