import { describe, it, expect } from "vitest";
import {
  generateStripeKit,
  validateStripeKitOptions,
  DEFAULT_STRIPE_KIT_OPTIONS,
  type StripeKitOptions,
} from "@/lib/billing/stripe-kit";

describe("billing/stripe-kit", () => {
  describe("DEFAULT_STRIPE_KIT_OPTIONS", () => {
    it("has two default plans", () => {
      expect(DEFAULT_STRIPE_KIT_OPTIONS.plans).toHaveLength(2);
    });

    it("enables subscriptions by default", () => {
      expect(DEFAULT_STRIPE_KIT_OPTIONS.subscriptions).toBe(true);
    });

    it("enables checkout by default", () => {
      expect(DEFAULT_STRIPE_KIT_OPTIONS.checkout).toBe(true);
    });

    it("enables webhooks by default", () => {
      expect(DEFAULT_STRIPE_KIT_OPTIONS.webhooks).toBe(true);
    });
  });

  describe("generateStripeKit", () => {
    it("generates files with default options", () => {
      const files = generateStripeKit();
      expect(files.length).toBeGreaterThanOrEqual(2);

      const paths = files.map((f) => f.path);
      expect(paths).toContain("lib/stripe.ts");
      expect(paths).toContain("lib/plans.ts");
    });

    it("generates checkout route for Next.js", () => {
      const files = generateStripeKit({ checkout: true, framework: "nextjs" });
      const checkout = files.find((f) => f.path.includes("checkout"));
      expect(checkout).toBeDefined();
      expect(checkout!.path).toContain("app/api/checkout");
    });

    it("generates webhook route for Next.js", () => {
      const files = generateStripeKit({ webhooks: true, framework: "nextjs" });
      const webhook = files.find((f) => f.path.includes("webhook"));
      expect(webhook).toBeDefined();
      expect(webhook!.content).toContain("stripe-signature");
    });

    it("generates express routes when framework is express", () => {
      const files = generateStripeKit({ framework: "express", checkout: true });
      const checkout = files.find((f) => f.path.includes("checkout"));
      expect(checkout).toBeDefined();
      expect(checkout!.content).toContain("Router");
    });

    it("skips checkout route when disabled", () => {
      const files = generateStripeKit({ checkout: false });
      const checkout = files.find((f) => f.path.includes("checkout"));
      expect(checkout).toBeUndefined();
    });

    it("skips webhook route when disabled", () => {
      const files = generateStripeKit({ webhooks: false });
      const webhook = files.find((f) => f.path.includes("webhook"));
      expect(webhook).toBeUndefined();
    });

    it("generates JavaScript files when language is javascript", () => {
      const files = generateStripeKit({ language: "javascript" });
      const stripeLib = files.find((f) => f.path === "lib/stripe.js");
      expect(stripeLib).toBeDefined();
    });

    it("includes plan names in generated config", () => {
      const files = generateStripeKit({
        plans: [
          { name: "Basic", priceMonthly: 5, currency: "usd", features: ["Feature A"] },
        ],
      });
      const plansFile = files.find((f) => f.path.includes("plans"));
      expect(plansFile!.content).toContain("Basic");
    });
  });

  describe("validateStripeKitOptions", () => {
    it("returns no errors for valid options", () => {
      const errors = validateStripeKitOptions(DEFAULT_STRIPE_KIT_OPTIONS);
      expect(errors).toHaveLength(0);
    });

    it("reports error for empty plans array", () => {
      const errors = validateStripeKitOptions({ plans: [] });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("plan");
    });

    it("reports error for plan without name", () => {
      const errors = validateStripeKitOptions({
        plans: [{ name: "", priceMonthly: 10, currency: "usd", features: [] }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it("reports error for negative price", () => {
      const errors = validateStripeKitOptions({
        plans: [{ name: "Test", priceMonthly: -5, currency: "usd", features: [] }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it("returns no errors when no plans provided", () => {
      const errors = validateStripeKitOptions({});
      expect(errors).toHaveLength(0);
    });
  });
});
