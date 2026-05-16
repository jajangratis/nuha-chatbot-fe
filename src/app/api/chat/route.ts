import { NextResponse } from "next/server";

const CHATBOT_API_URL =
  process.env.CHATBOT_API_URL ?? "http://localhost:3000/api/chat";

const TIMEOUT_MS = 180_000;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON tidak valid." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("message" in body) ||
    typeof (body as { message: unknown }).message !== "string" ||
    !(body as { message: string }).message.trim()
  ) {
    return NextResponse.json(
      { error: 'Field "message" wajib diisi.' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(CHATBOT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const text = await upstream.text();
    let payload: unknown = {};

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { answer: text };
      }
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghubungi chatbot API.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
