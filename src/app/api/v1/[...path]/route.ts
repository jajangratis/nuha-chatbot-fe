import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPPORT_API_BASE =
  process.env.SUPPORT_API_URL ?? "http://127.0.0.1:3000/api/v1";

const TIMEOUT_MS = 180_000;

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const search = request.nextUrl.search;
  const url = `${SUPPORT_API_BASE}/${path}${search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const guestToken = request.headers.get("x-guest-session-token");
  if (guestToken) {
    headers.set("X-Guest-Session-Token", guestToken);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType?.includes("multipart/form-data")) {
      init.body = await request.arrayBuffer();
    } else {
      init.body = await request.text();
    }
  }

  try {
    const upstream = await fetch(url, init);
    const resContentType = upstream.headers.get("content-type") || "";

    if (!resContentType.includes("application/json")) {
      const buf = await upstream.arrayBuffer();
      const outHeaders = new Headers();
      if (resContentType) outHeaders.set("Content-Type", resContentType);
      const disposition = upstream.headers.get("content-disposition");
      if (disposition) outHeaders.set("Content-Disposition", disposition);
      return new NextResponse(buf, { status: upstream.status, headers: outHeaders });
    }

    const text = await upstream.text();
    let payload: unknown = {};

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghubungi Support API.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
