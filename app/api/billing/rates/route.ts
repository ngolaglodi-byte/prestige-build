import { NextResponse } from "next/server";
import {
  detectCountryFromHeaders,
  detectCountryFromLocale,
  currencyForCountry,
  fetchFxRates,
  convertPrice,
  CURRENCIES,
  type CurrencyCode,
} from "@/lib/billing/pricing";
import { PLANS } from "@/lib/billing/plans";

/**
 * GET /api/billing/rates
 *
 * Returns:
 * - detected country & currency
 * - FX rates
 * - converted plan prices in local currency
 *
 * Query params (optional):
 *   ?country=XX  – override detection (useful for testing)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const headers = new Headers(req.headers);

  // 1. Detect country
  let country =
    searchParams.get("country")?.toUpperCase() ||
    detectCountryFromHeaders(headers) ||
    detectCountryFromLocale(headers.get("accept-language"));

  if (!country) country = "US"; // default

  // 2. Resolve currency
  const currencyCode = currencyForCountry(country);
  const currencyInfo = CURRENCIES[currencyCode];

  // 3. Fetch FX rates
  const rates = await fetchFxRates();
  const rate = rates[currencyCode] ?? 1;

  // 4. Build converted prices per plan
  const plans: Record<
    string,
    { priceUsd: number; priceLocal: number; currency: CurrencyCode }
  > = {};
  for (const [id, plan] of Object.entries(PLANS)) {
    plans[id] = {
      priceUsd: plan.priceUsd,
      priceLocal: convertPrice(plan.priceUsd, currencyCode, rates),
      currency: currencyCode,
    };
  }

  return NextResponse.json({
    country,
    currency: currencyCode,
    symbol: currencyInfo.symbol,
    rate,
    plans,
  });
}
