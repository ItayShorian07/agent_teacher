import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = await fetch(new URL("/model-architecture.png", request.url));
  if (!response.ok) {
    return NextResponse.json({ error: "Architecture image is unavailable." }, { status: 500 });
  }
  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
