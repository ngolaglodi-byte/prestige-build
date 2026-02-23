/** Dynamic pricing engine — country detection, currency mapping & FX conversion */

// ---------------------------------------------------------------------------
// Currency definitions
// ---------------------------------------------------------------------------
export type CurrencyCode = "USD" | "XOF" | "XAF" | "KES" | "GHS" | "ZMW" | "NGN";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  /** Number of decimal places to keep after rounding */
  decimals: number;
  /** Friendly rounding step (e.g. 500 for XOF so price ends in round hundreds) */
  roundTo: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", decimals: 2, roundTo: 1 },
  XOF: { code: "XOF", symbol: "FCFA", decimals: 0, roundTo: 500 },
  XAF: { code: "XAF", symbol: "FCFA", decimals: 0, roundTo: 500 },
  KES: { code: "KES", symbol: "KSh", decimals: 0, roundTo: 50 },
  GHS: { code: "GHS", symbol: "GH₵", decimals: 2, roundTo: 1 },
  ZMW: { code: "ZMW", symbol: "ZK", decimals: 0, roundTo: 10 },
  NGN: { code: "NGN", symbol: "₦", decimals: 0, roundTo: 500 },
};

// ---------------------------------------------------------------------------
// Country → Currency mapping
// ---------------------------------------------------------------------------
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  // XOF zone
  CI: "XOF", // Côte d'Ivoire
  SN: "XOF", // Sénégal
  BJ: "XOF", // Bénin
  TG: "XOF", // Togo
  BF: "XOF", // Burkina Faso
  ML: "XOF", // Mali
  NE: "XOF", // Niger
  // XAF zone
  CM: "XAF", // Cameroun
  GA: "XAF", // Gabon
  TD: "XAF", // Tchad
  CF: "XAF", // RCA
  CG: "XAF", // Congo-Brazzaville
  // Others
  KE: "KES", // Kenya
  GH: "GHS", // Ghana
  ZM: "ZMW", // Zambie
  NG: "NGN", // Nigeria
  CD: "USD", // RDC — prices stay in USD
  US: "USD", // USA
};

// PawaPay correspondent per country
export const PAWAPAY_CORRESPONDENTS: Record<string, string> = {
  CD: "MTN_MOMO_COD",
  CI: "MTN_MOMO_CIV",
  SN: "ORANGE_SEN",
  BJ: "MTN_MOMO_BEN",
  TG: "MOOV_TGO",
  BF: "ORANGE_BFA",
  ML: "ORANGE_MLI",
  NE: "AIRTEL_NER",
  CM: "MTN_MOMO_CMR",
  GA: "AIRTEL_GAB",
  TD: "AIRTEL_TCD",
  CF: "ORANGE_CAF",
  CG: "MTN_MOMO_COG",
  KE: "MPESA_KEN",
  GH: "MTN_MOMO_GHA",
  ZM: "MTN_MOMO_ZMB",
  NG: "OPAY_NGA",
};

// ---------------------------------------------------------------------------
// Country detection helpers
// ---------------------------------------------------------------------------

/** Detect ISO-3166-1 alpha-2 country from request headers (works on Vercel / Cloudflare). */
export function detectCountryFromHeaders(headers: Headers): string | null {
  // Cloudflare
  const cf = headers.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf.toUpperCase();

  // Vercel
  const vercel = headers.get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();

  return null;
}

/** Detect country from browser Accept-Language (rough heuristic). */
export function detectCountryFromLocale(acceptLang: string | null): string | null {
  if (!acceptLang) return null;

  const localeCountryMap: Record<string, string> = {
    "fr-CD": "CD",
    "fr-CI": "CI",
    "fr-SN": "SN",
    "fr-BJ": "BJ",
    "fr-TG": "TG",
    "fr-BF": "BF",
    "fr-ML": "ML",
    "fr-NE": "NE",
    "fr-CM": "CM",
    "fr-GA": "GA",
    "fr-TD": "TD",
    "fr-CF": "CF",
    "fr-CG": "CG",
    "en-KE": "KE",
    "en-GH": "GH",
    "en-ZM": "ZM",
    "en-NG": "NG",
    "en-US": "US",
  };

  const primary = acceptLang.split(",")[0]?.trim().split(";")[0]?.trim();
  if (primary && localeCountryMap[primary]) {
    return localeCountryMap[primary];
  }
  return null;
}

/** Resolve the currency for a given country. Falls back to USD. */
export function currencyForCountry(countryCode: string | null): CurrencyCode {
  if (!countryCode) return "USD";
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? "USD";
}

// ---------------------------------------------------------------------------
// FX conversion
// ---------------------------------------------------------------------------
export type FxRates = Record<string, number>;

const FX_CACHE: { rates: FxRates | null; ts: number } = { rates: null, ts: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_SEC = CACHE_TTL_MS / 1000;

/** Fetch live FX rates (base USD) from a free API. Results are cached for 1 h. */
export async function fetchFxRates(): Promise<FxRates> {
  const now = Date.now();
  if (FX_CACHE.rates && now - FX_CACHE.ts < CACHE_TTL_MS) {
    return FX_CACHE.rates;
  }

  // Fallback rates if the API is unreachable
  const fallback: FxRates = {
    USD: 1,
    XOF: 615,
    XAF: 615,
    KES: 155,
    GHS: 15,
    ZMW: 27,
    NGN: 1600,
  };

  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: CACHE_TTL_SEC } },
    );
    if (!res.ok) throw new Error("FX API error");
    const data = await res.json();
    const rates: FxRates = {};
    for (const code of Object.keys(CURRENCIES)) {
      rates[code] = data.rates?.[code] ?? fallback[code] ?? 1;
    }
    FX_CACHE.rates = rates;
    FX_CACHE.ts = now;
    return rates;
  } catch {
    FX_CACHE.rates = fallback;
    FX_CACHE.ts = now;
    return fallback;
  }
}

/** Convert a USD price to the target currency and round according to its rules. */
export function convertPrice(
  usdPrice: number,
  currency: CurrencyCode,
  rates: FxRates,
): number {
  if (currency === "USD") return usdPrice;
  const rate = rates[currency] ?? 1;
  const raw = usdPrice * rate;
  const info = CURRENCIES[currency];
  // Round to the nearest `roundTo` step
  const rounded = Math.round(raw / info.roundTo) * info.roundTo;
  return Number(rounded.toFixed(info.decimals));
}

/** Format a price with its currency symbol. */
export function formatPrice(amount: number, currency: CurrencyCode): string {
  const info = CURRENCIES[currency];
  const formatted = amount.toLocaleString("fr-FR", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  if (currency === "USD") return `${formatted} $`;
  return `${formatted} ${info.symbol}`;
}
