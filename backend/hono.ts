import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { trpcServer } from "@hono/trpc-server";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts, c) => {
      return createContext(opts);
    },
    onError({ error, path }) {
      console.error(`❌ tRPC Error on ${path}:`, error);
    },
    responseMeta() {
      return {
        headers: {
          "Content-Type": "application/json",
        },
      };
    },
  })
);

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