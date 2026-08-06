import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import { runSeed } from "../src/lib/run-seed";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — cannot seed the database.");
}

const db = new PrismaClient();

runSeed(db)
  .then((result) => {
    console.log("Seed complete.", result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
