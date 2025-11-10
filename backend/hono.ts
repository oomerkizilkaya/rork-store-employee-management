import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
}));

app.use("*", async (c, next) => {
  console.log(`🚀 Incoming request: ${c.req.method} ${c.req.url}`);
  await next();
  console.log(`✅ Response status: ${c.res.status}`);
});

app.all("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`❌ tRPC Error on ${path}:`, error);
    },
    responseMeta() {
      return {
        headers: {
          'content-type': 'application/json',
        },
      };
    },
  });
});

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "tRPC API is running" });
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

export default app;