import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding plans...");

  await prisma.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      maxActivePreviews: 1,
      maxCpuPercent: 20,
      maxMemoryMb: 256,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      name: "Starter",
      slug: "starter",
      maxActivePreviews: 2,
      maxCpuPercent: 40,
      maxMemoryMb: 512,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      maxActivePreviews: 5,
      maxCpuPercent: 80,
      maxMemoryMb: 1024,
    },
  });

  console.log("✅ Plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
