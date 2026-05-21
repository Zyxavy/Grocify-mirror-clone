import { neon } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { bigint, boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

// Schema (inline — Workers can't import from src/)
const groceryItems = pgTable("grocery_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  purchased: boolean("purchased").notNull().default(false),
  priority: text("priority").notNull().default("medium"),
  updated_at: bigint("updated_at", { mode: "number" }).notNull(),
});

// DB client factory (per-request, uses env)
function getDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema: { groceryItems } });
}

// CORS headers
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// Env type
interface Env {
  DATABASE_URL: string;
}

// Main handler
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const db = getDb(env.DATABASE_URL);
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // GET /api/items
      if (path === "/api/items" && req.method === "GET") {
        const items = await db
          .select()
          .from(groceryItems)
          .orderBy(desc(groceryItems.updated_at));
        return json({ items });
      }

      // POST /api/items
      if (path === "/api/items" && req.method === "POST") {
        const body = await req.json() as {
          name: string;
          category: string;
          quantity: number;
          priority: string;
        };

        const { name, category, quantity, priority } = body;

        if (!name || !category || !priority) {
          return json({ error: "Please provide all required fields." }, 400);
        }

        const rows = await db
          .insert(groceryItems)
          .values({
            id: crypto.randomUUID(),
            name,
            category,
            quantity: Math.max(1, quantity),
            purchased: false,
            priority,
            updated_at: Date.now(),
          })
          .returning();

        return json({ item: rows[0] }, 201);
      }

      // POST /api/items/clear-purchased
      if (path === "/api/items/clear-purchased" && req.method === "POST") {
        await db.delete(groceryItems).where(eq(groceryItems.purchased, true));
        return json({ ok: true });
      }

      // PATCH /api/items/:id
      const patchMatch = path.match(/^\/api\/items\/([^/]+)$/);
      if (patchMatch && req.method === "PATCH") {
        const id = patchMatch[1];
        const body = await req.json() as {
          quantity?: number;
          purchased?: boolean;
        };

        let rows;

        if (body.quantity !== undefined) {
          rows = await db
            .update(groceryItems)
            .set({
              quantity: Math.max(1, Math.floor(body.quantity)),
              updated_at: Date.now(),
            })
            .where(eq(groceryItems.id, id))
            .returning();
        } else {
          rows = await db
            .update(groceryItems)
            .set({
              purchased: body.purchased ?? true,
              updated_at: Date.now(),
            })
            .where(eq(groceryItems.id, id))
            .returning();
        }

        if (!rows.length) return json({ error: "Item not found." }, 404);
        return json({ item: rows[0] });
      }

      // DELETE /api/items/:id
      const deleteMatch = path.match(/^\/api\/items\/([^/]+)$/);
      if (deleteMatch && req.method === "DELETE") {
        const id = deleteMatch[1];
        await db.delete(groceryItems).where(eq(groceryItems.id, id));
        return json({ ok: true });
      }

      return json({ error: "Not found." }, 404);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return json({ error: message }, 500);
    }
  },
};