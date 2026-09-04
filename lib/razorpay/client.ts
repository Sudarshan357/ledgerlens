// Razorpay service abstraction.
//
// The product works fully on synthetic demo data with no credentials. When
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are present, this module can reach
// the Razorpay Test Mode API to cross-check settlement reconciliation — but
// nothing in the UI depends on that path being available, and no code here
// ever claims access to real/production Razorpay data.

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/** Fetch settlements from Razorpay Test Mode, for optional cross-checking.
 * Returns null when not configured or when the call fails — callers must
 * always have a synthetic-data fallback and never assume this succeeds. */
export async function fetchTestSettlements(count = 10): Promise<unknown | null> {
  if (!isRazorpayConfigured()) return null;
  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/settlements?count=${count}`, {
      headers: { Authorization: authHeader() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getEnvironmentLabel(): string {
  return isRazorpayConfigured() ? "Razorpay Test Environment (connected)" : "Razorpay Test Environment (synthetic data)";
}
