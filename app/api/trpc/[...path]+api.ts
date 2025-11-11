import app from "../../../backend/hono";

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log("🛠️ API Route Handler", {
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    search: url.search,
  });

  try {
    const response = await app.fetch(request);
    
    console.log("✅ Hono response received:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    
    return response;
  } catch (error) {
    console.error("❌ Error in API route handler:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function PUT(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleRequest(request);
}
