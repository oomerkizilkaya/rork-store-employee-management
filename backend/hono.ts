import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => origin || '*',
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

const handleTrpcRequest = async (c: Context) => {
  const url = new URL(c.req.url);
  console.log(`🔧 Handling tRPC request: ${c.req.method} ${url.pathname}`);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext: (opts) => createContext(opts),
      onError({ error, path }) {
        console.error(`❌ tRPC Error on ${path}:`, {
          message: error.message,
          code: error.code,
          cause: error.cause,
        });
      },
    });
    
    console.log(`✅ tRPC response:`, {
      status: response.status,
      contentType: response.headers.get('content-type'),
    });
    
    return response;
  } catch (error) {
    console.error(`❌ Error in handleTrpcRequest:`, error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
};

app.post("/api/trpc", handleTrpcRequest);
app.get("/api/trpc", handleTrpcRequest);
app.post("/api/trpc/*", handleTrpcRequest);
app.get("/api/trpc/*", handleTrpcRequest);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "tRPC API is running" });
});

app.notFound((c) => {
  const url = new URL(c.req.url);
  console.error(`❌ 404 Not Found: ${c.req.method} ${url.pathname}`);
  return c.json({ error: "Not Found", path: url.pathname }, 404);
});

export default app;