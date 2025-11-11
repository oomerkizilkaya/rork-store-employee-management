import { Hono } from "hono";
import type { Context } from "hono";
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
  const url = new URL(c.req.url);
  console.log(`🚀 Hono received: ${c.req.method} ${url.pathname}`);
  await next();
  console.log(`✅ Hono response: ${c.res.status}`);
});

const handleTrpcRequest = async (c: Context) => {
  const url = new URL(c.req.url);
  console.log(`🔧 Handling tRPC request: ${url.pathname}`);
  console.log(`🔧 Full URL: ${url.toString()}`);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`❌ tRPC Error on ${path}:`, error);
        console.error(`❌ Error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      },
      responseMeta() {
        return {
          headers: {
            'content-type': 'application/json',
          },
        };
      },
    });
    
    console.log(`✅ tRPC response status:`, response.status);
    const contentType = response.headers.get('content-type');
    console.log(`✅ tRPC response content-type:`, contentType);
    return response;
  } catch (error) {
    console.error(`❌ Error in handleTrpcRequest:`, error);
    throw error;
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