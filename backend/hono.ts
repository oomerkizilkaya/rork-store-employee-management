import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => {
    console.log('🌐 CORS origin:', origin);
    return origin || '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400,
}));

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  console.log(`🚀 Hono received: ${c.req.method} ${url.pathname}`);
  await next();
  console.log(`✅ Hono response: ${c.res.status}`);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async ({ req }) => {
      const url = new URL(req.url);
      console.log(`🔧 tRPC context creation: ${req.method} ${url.pathname}`);
      const authHeader = req.headers.get('authorization');
      console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
      return createContext({ req, resHeaders: new Headers() });
    },
    onError({ error, path, ctx }) {
      console.error(`❌ tRPC Error on ${path}:`, {
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "tRPC API is running" });
});

app.get("/api/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    routes: [
      "/api/trpc",
      "/api/trpc/*",
    ]
  });
});

app.post("/api/test", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ 
    status: "ok", 
    message: "Test endpoint working",
    receivedBody: body,
    timestamp: new Date().toISOString(),
  });
});

app.notFound((c) => {
  const url = new URL(c.req.url);
  console.error(`❌ 404 Not Found: ${c.req.method} ${url.pathname}`);
  return c.json({ error: "Not Found", path: url.pathname }, 404);
});

export default app;