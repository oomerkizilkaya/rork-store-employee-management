import app from "../../../backend/hono";

export async function GET(request: Request): Promise<Response> {
  console.log("🛠️ API GET /api/trpc/*");
  return app.fetch(request);
}

export async function POST(request: Request): Promise<Response> {
  console.log("🛠️ API POST /api/trpc/*");
  return app.fetch(request);
}

export async function PUT(request: Request): Promise<Response> {
  console.log("🛠️ API PUT /api/trpc/*");
  return app.fetch(request);
}

export async function PATCH(request: Request): Promise<Response> {
  console.log("🛠️ API PATCH /api/trpc/*");
  return app.fetch(request);
}

export async function DELETE(request: Request): Promise<Response> {
  console.log("🛠️ API DELETE /api/trpc/*");
  return app.fetch(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  console.log("🛠️ API OPTIONS /api/trpc/*");
  return app.fetch(request);
}
