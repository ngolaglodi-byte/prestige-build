/**
 * Helper to parse request body (JSON or form data)
 * Supports both application/json and application/x-www-form-urlencoded content types
 */
export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return req.json();
  }
  const formData = await req.formData();
  const obj: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * Check if the request is a form submission (not JSON)
 */
export function isFormSubmission(req: Request): boolean {
  return (req.headers.get("content-type") || "").includes("form");
}
