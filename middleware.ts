import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isWebhookRoute = createRouteMatcher([
  "/api/clerk/webhook(.*)",
  "/api/billing/webhook(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for webhook routes — they use their own signature verification
  if (isWebhookRoute(req)) return;
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
