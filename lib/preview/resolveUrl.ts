export function resolvePreviewUrl(port: number) {
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${port}`;
  }

  return `https://preview.prestigebuild.com/${port}`;
}
