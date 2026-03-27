import app from "../../../backend/hono";

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log("🛠️ [API Route] Handling:", {
    method: request.method,
    pathname: url.pathname,
    search: url.search,
    fullUrl: url.toString(),
  });

  try {
    const modifiedUrl = new URL(request.url);
    let newPath = modifiedUrl.pathname;
    
    const trpcMatch = newPath.match(/\/api\/trpc(\/.*)?$/);
    if (trpcMatch) {
      newPath = '/trpc' + (trpcMatch[1] || '');
    }
    
    modifiedUrl.pathname = newPath;
    console.log("🔄 [API Route] Modified URL:", modifiedUrl.pathname + modifiedUrl.search);
    
    const modifiedRequest = new Request(modifiedUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: 'half' as RequestDuplex,
    });
    
    const response = await app.fetch(modifiedRequest);
    
    console.log("📦 [API Route] Response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      headers: Array.from(response.headers.entries()),
    });
    
    if (!response.ok) {
      const text = await response.clone().text();
      console.error("❌ [API Route] Error response:", {
        status: response.status,
        body: text.substring(0, 500),
      });
    }
    
    return response;
  } catch (error) {
    console.error("❌ [API Route] Critical error:", error);
    if (error instanceof Error) {
      console.error("❌ [API Route] Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
