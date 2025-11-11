import app from "../../../backend/hono";

export async function GET(request: Request): Promise<Response> {
  console.log("🛠️ API GET", request.url);
  const url = new URL(request.url);
  console.log("📍 Original path:", url.pathname);
  
  const modifiedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return app.fetch(modifiedRequest);
}

export async function POST(request: Request): Promise<Response> {
  console.log("🛠️ API POST", request.url);
  const url = new URL(request.url);
  console.log("📍 Original path:", url.pathname);
  
  const modifiedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return app.fetch(modifiedRequest);
}

export async function PUT(request: Request): Promise<Response> {
  console.log("🛠️ API PUT", request.url);
  return app.fetch(request);
}

export async function PATCH(request: Request): Promise<Response> {
  console.log("🛠️ API PATCH", request.url);
  return app.fetch(request);
}

export async function DELETE(request: Request): Promise<Response> {
  console.log("🛠️ API DELETE", request.url);
  return app.fetch(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  console.log("🛠️ API OPTIONS", request.url);
  return app.fetch(request);
}
