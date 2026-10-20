import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const allowed = /^\/(tasks(?:\/\d+)?|members)$/;

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const suffix = `/${path.join("/")}`;
  if (!allowed.test(suffix))
    return NextResponse.json({ detail: "지원하지 않는 경로입니다." }, { status: 404 });
  if (suffix === "/members" && request.method !== "GET")
    return NextResponse.json({ detail: "지원하지 않는 요청입니다." }, { status: 405 });
  const base = process.env["TODO_API_BASE_URL"] ?? "http://127.0.0.1:8000";
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1${suffix}`, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: request.method === "GET" ? null : await request.text(),
      cache: "no-store",
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "백엔드에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
