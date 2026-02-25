import { describe, it, expect } from "vitest";
import { apiOk, apiError } from "@/lib/api-response";

describe("apiOk", () => {
  it("returns ok:true with data", async () => {
    const res = apiOk({ foo: "bar" });
    const json = await res.json();
    expect(json).toEqual({ ok: true, data: { foo: "bar" } });
    expect(res.status).toBe(200);
  });

  it("supports custom status code", async () => {
    const res = apiOk("created", 201);
    expect(res.status).toBe(201);
  });
});

describe("apiError", () => {
  it("returns ok:false with error message", async () => {
    const res = apiError("Not found", 404);
    const json = await res.json();
    expect(json).toEqual({ ok: false, error: "Not found" });
    expect(res.status).toBe(404);
  });

  it("defaults to status 400", async () => {
    const res = apiError("Bad request");
    expect(res.status).toBe(400);
  });
});
