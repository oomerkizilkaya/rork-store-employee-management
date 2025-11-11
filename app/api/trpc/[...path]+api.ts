import app from "../../../backend/hono";

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log("🛠️ API Route Handler:", {
    method: request.method,
    pathname: url.pathname,
  });

  try {
    const response = await app.fetch(request);
    
    if (!response.ok) {
      const text = await response.clone().text();
      console.error("❌ Hono error response:", {
        status: response.status,
        body: text.substring(0, 200),
      });
    } else {
      console.log("✅ Hono success:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
      });
    }
    
    return response;
  } catch (error) {
    console.error("❌ Critical error in API route handler:", error);
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
