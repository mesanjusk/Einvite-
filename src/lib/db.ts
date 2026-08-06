import { PrismaClient } from "@prisma/client";

const MISSING_DATABASE_URL_MESSAGE =
  "DATABASE_URL is not set. Copy .env.example to .env and point it at your MongoDB instance (Atlas or otherwise).";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * A stand-in for any part of the Prisma client — `db.$connect`,
 * `db.theme.findMany`, etc. — that turns every eventual call into a
 * rejected promise instead of throwing synchronously at property-access
 * time. Used only when DATABASE_URL is missing, so `await
 * db.theme.findMany()` inside a try/catch and `db.theme.findMany().catch(
 * ...)` chains both behave the way callers already expect from a real
 * (failing) query. Recursive and callable at every depth since we don't
 * know ahead of time whether a given property is a direct client method
 * ($connect) or a model delegate that needs one more property hop
 * (theme.findMany).
 */
function unconfiguredStub(): unknown {
  const target = () => Promise.reject(new Error(MISSING_DATABASE_URL_MESSAGE));
  return new Proxy(target, {
    get: () => unconfiguredStub(),
  });
}

// A Proxy so `db` can be imported anywhere — including modules Next.js
// touches during build-time route introspection — without constructing
// the real client (and requiring DATABASE_URL) until a query actually
// runs. Constructing eagerly at module scope used to fail the entire
// build the moment DATABASE_URL was missing, even for routes that never
// query the database.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma && !process.env.DATABASE_URL) {
      return unconfiguredStub();
    }
    return Reflect.get(getClient(), prop, receiver);
  },
});
