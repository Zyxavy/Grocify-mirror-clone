import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = "https://grocify-api.kelpselp.workers.dev";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for API routes.");
}

const sql = neon(databaseUrl);

export const db = drizzle({ client: sql, schema });
