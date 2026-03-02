import { NextResponse } from "next/server";

export type ApiEnvelope<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiEnvelope<T>, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error } satisfies ApiEnvelope, { status });
}
