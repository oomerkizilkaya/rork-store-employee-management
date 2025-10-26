import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
}));

app.all("/api/trpc/*", async (c) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: (opts) => createContext(opts),
    onError({ error, path }) {
      console.error(`❌ tRPC Error on ${path}:`, error);
    },
  });
  return response;
});

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;