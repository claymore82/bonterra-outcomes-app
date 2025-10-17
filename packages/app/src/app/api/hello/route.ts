import { NextRequest, NextResponse } from "next/server";

/**
 * Example API endpoint with query parameters
 * GET /api/hello?name=World
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name") || "World";

  return NextResponse.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Example POST endpoint
 * POST /api/hello
 * Body: { "name": "string" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || "World";

    return NextResponse.json({
      message: `Hello, ${name}!`,
      received: body,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
