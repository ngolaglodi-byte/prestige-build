/**
 * Stripe Kit — generates Stripe integration code for user apps.
 *
 * This module provides templates that users can include in their
 * generated applications.  It does NOT interact with the Stripe
 * API directly; it outputs ready-to-use source files.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StripeKitOptions {
  /** Product/plan names to generate */
  plans: StripePlan[];
  /** Whether to include subscription support */
  subscriptions: boolean;
  /** Whether to include one-time checkout */
  checkout: boolean;
  /** Whether to generate webhook handler */
  webhooks: boolean;
  /** Framework (nextjs, express, etc.) */
  framework: "nextjs" | "express";
  /** Language */
  language: "typescript" | "javascript";
}

export interface StripePlan {
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

export const DEFAULT_STRIPE_KIT_OPTIONS: StripeKitOptions = {
  plans: [
    {
      name: "Starter",
      priceMonthly: 9,
      currency: "usd",
      features: ["Basic features", "Email support"],
    },
    {
      name: "Pro",
      priceMonthly: 29,
      currency: "usd",
      features: ["All features", "Priority support", "API access"],
    },
  ],
  subscriptions: true,
  checkout: true,
  webhooks: true,
  framework: "nextjs",
  language: "typescript",
};

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateStripeLib(opts: StripeKitOptions): GeneratedFile {
  const ext = opts.language === "typescript" ? "ts" : "js";
  const typeAnnotation = opts.language === "typescript" ? ": Stripe" : "";

  return {
    path: `lib/stripe.${ext}`,
    content: `import Stripe from "stripe";

const stripe${typeAnnotation} = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default stripe;
`,
  };
}

function generatePlansConfig(opts: StripeKitOptions): GeneratedFile {
  const ext = opts.language === "typescript" ? "ts" : "js";
  const typeExport =
    opts.language === "typescript"
      ? `\nexport interface PricingPlan {\n  name: string;\n  priceMonthly: number;\n  currency: string;\n  features: string[];\n  priceId: string;\n}\n\n`
      : "";

  const plansArray = opts.plans
    .map(
      (p, i) =>
        `  {\n    name: "${p.name}",\n    priceMonthly: ${p.priceMonthly},\n    currency: "${p.currency}",\n    features: ${JSON.stringify(p.features)},\n    priceId: process.env.STRIPE_PRICE_${p.name.toUpperCase()}_ID ?? "price_placeholder_${i}",\n  }`
    )
    .join(",\n");

  return {
    path: `lib/plans.${ext}`,
    content: `${typeExport}export const PLANS${opts.language === "typescript" ? ": PricingPlan[]" : ""} = [\n${plansArray}\n];\n`,
  };
}

function generateCheckoutRoute(opts: StripeKitOptions): GeneratedFile {
  const isNextjs = opts.framework === "nextjs";
  const ext = opts.language === "typescript" ? "ts" : "js";

  if (isNextjs) {
    return {
      path: `app/api/checkout/route.${ext}`,
      content: `import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req${opts.language === "typescript" ? ": NextRequest" : ""}) {
  const { priceId, successUrl, cancelUrl } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? \`\${process.env.NEXT_PUBLIC_URL}/success\`,
    cancel_url: cancelUrl ?? \`\${process.env.NEXT_PUBLIC_URL}/pricing\`,
  });

  return NextResponse.json({ url: session.url });
}
`,
    };
  }

  return {
    path: `routes/checkout.${ext}`,
    content: `import { Router } from "express";
import stripe from "../lib/stripe";

const router = Router();

router.post("/checkout", async (req, res) => {
  const { priceId, successUrl, cancelUrl } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? process.env.APP_URL + "/success",
    cancel_url: cancelUrl ?? process.env.APP_URL + "/pricing",
  });

  res.json({ url: session.url });
});

export default router;
`,
  };
}

function generateWebhookRoute(opts: StripeKitOptions): GeneratedFile {
  const isNextjs = opts.framework === "nextjs";
  const ext = opts.language === "typescript" ? "ts" : "js";

  if (isNextjs) {
    return {
      path: `app/api/webhooks/stripe/route.${ext}`,
      content: `import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req${opts.language === "typescript" ? ": NextRequest" : ""}) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Handle successful checkout
      break;
    case "customer.subscription.updated":
      // Handle subscription update
      break;
    case "customer.subscription.deleted":
      // Handle subscription cancellation
      break;
    case "invoice.payment_failed":
      // Handle failed payment
      break;
  }

  return NextResponse.json({ received: true });
}
`,
    };
  }

  return {
    path: `routes/stripe-webhook.${ext}`,
    content: `import { Router } from "express";
import stripe from "../lib/stripe";

const router = Router();

router.post(
  "/webhooks/stripe",
  (req, res) => {
    const signature = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "checkout.session.completed":
        break;
      case "customer.subscription.updated":
        break;
      case "customer.subscription.deleted":
        break;
      case "invoice.payment_failed":
        break;
    }

    res.json({ received: true });
  }
);

export default router;
`,
  };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateStripeKit(
  options: Partial<StripeKitOptions> = {}
): GeneratedFile[] {
  const opts: StripeKitOptions = { ...DEFAULT_STRIPE_KIT_OPTIONS, ...options };
  const files: GeneratedFile[] = [];

  // Always generate the Stripe lib + plans config
  files.push(generateStripeLib(opts));
  files.push(generatePlansConfig(opts));

  if (opts.checkout) {
    files.push(generateCheckoutRoute(opts));
  }

  if (opts.webhooks) {
    files.push(generateWebhookRoute(opts));
  }

  return files;
}

/**
 * Validate Stripe kit options before generation.
 */
export function validateStripeKitOptions(
  opts: Partial<StripeKitOptions>
): string[] {
  const errors: string[] = [];

  if (opts.plans && opts.plans.length === 0) {
    errors.push("Au moins un plan est requis");
  }

  if (opts.plans) {
    for (const plan of opts.plans) {
      if (!plan.name || plan.name.trim() === "") {
        errors.push("Chaque plan doit avoir un nom");
      }
      if (plan.priceMonthly < 0) {
        errors.push(`Le prix du plan "${plan.name}" ne peut pas être négatif`);
      }
    }
  }

  return errors;
}
