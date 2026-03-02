import { NextRequest, NextResponse } from "next/server";
import {
  generateStripeKit,
  validateStripeKitOptions,
  type StripeKitOptions,
} from "@/lib/billing/stripe-kit";

export async function POST(req: NextRequest) {
  try {
    const body: Partial<StripeKitOptions> = await req.json();

    // Validate options
    const errors = validateStripeKitOptions(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const files = generateStripeKit(body);

    return NextResponse.json({
      files,
      count: files.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
