import { mulberry32, randFloat, randId, randInt, seedFromString, type RNG } from "./rng";
import type {
  Adjustment,
  Dataset,
  FeeTax,
  Merchant,
  Order,
  Payment,
  Refund,
  SettlementBatch,
  TransactionRecon,
} from "./types";
import {
  AFFECTED_TRANSACTIONS,
  BATCH_PLAN,
  CONFIRMED_DISCREPANCY,
  CONFIRMED_TRANSACTIONS,
  FEATURED,
  FEE_RATE,
  POTENTIAL_EXPOSURE,
  SEED,
  TAX_RATE,
  INCIDENT_TIMES,
} from "./constants";

const BANK_CODES = ["HDFC", "ICIC", "SBIN", "AXIS", "KKBK", "UTIB"];

const MERCHANT_SEED: Array<Pick<Merchant, "id" | "name" | "category" | "affected">> = [
  { id: "M1", name: "Zenith Retail", category: "E-commerce", affected: true },
  { id: "M2", name: "Orbit Electronics", category: "Consumer Electronics", affected: true },
  { id: "M3", name: "Bluewave Travels", category: "Travel & Booking", affected: true },
  { id: "M4", name: "Nimbus Mart", category: "Grocery & Essentials", affected: true },
  { id: "M5", name: "Craftly Home", category: "Home & Living", affected: false },
  { id: "M6", name: "Verve Fashion", category: "Fashion & Apparel", affected: false },
  { id: "M7", name: "Pinnacle Foods", category: "Food & Beverage", affected: false },
  { id: "M8", name: "Swift Logistics", category: "Logistics", affected: false },
  { id: "M9", name: "Lumen Beauty", category: "Beauty & Personal Care", affected: false },
  { id: "M10", name: "Anchor Books", category: "Books & Media", affected: false },
];

function utrFor(rng: RNG): string {
  const bank = BANK_CODES[Math.floor(rng() * BANK_CODES.length)];
  let digits = "";
  for (let i = 0; i < 11; i++) digits += Math.floor(rng() * 10);
  return `${bank}${digits}`;
}

function isoAt(dateISO: string, hhmm: string, offsetSeconds = 0): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${dateISO}T00:00:00+05:30`);
  d.setUTCHours(0, 0, 0, 0);
  const ms = ((h * 60 + m) * 60 + offsetSeconds) * 1000;
  return new Date(new Date(`${dateISO}T00:00:00+05:30`).getTime() + ms).toISOString();
}

function minutesBetween(dateISO: string, startHHMM: string, endHHMM: string, t: number): string {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const startSec = (sh * 60 + sm) * 60;
  const endSec = (eh * 60 + em) * 60;
  const sec = Math.round(startSec + (endSec - startSec) * t);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return isoAt(dateISO, `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, s);
}

/** Scale a list of raw values so they sum exactly to `target`, rounding to
 * whole rupees and fixing residual drift on the largest element. */
function scaleToExactSum(raw: number[], target: number): number[] {
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const scale = target / rawSum;
  const scaled = raw.map((v) => Math.round(v * scale));
  const drift = target - scaled.reduce((a, b) => a + b, 0);
  let maxIdx = 0;
  for (let i = 1; i < scaled.length; i++) if (scaled[i] > scaled[maxIdx]) maxIdx = i;
  scaled[maxIdx] += drift;
  return scaled;
}

let cached: Dataset | null = null;

export function getDataset(): Dataset {
  if (cached) return cached;
  cached = buildDataset();
  return cached;
}

function buildDataset(): Dataset {
  const rng = mulberry32(seedFromString(SEED));
  const incidentDate = "2026-09-03";

  const merchants: Merchant[] = MERCHANT_SEED.map((m) => ({
    ...m,
    vpa: `${m.name.toLowerCase().replace(/[^a-z]+/g, "")}@razorpay`,
  }));

  const orders: Order[] = [];
  const payments: Payment[] = [];
  const refunds: Refund[] = [];
  const adjustments: Adjustment[] = [];
  const feesTaxes: FeeTax[] = [];
  const batches: SettlementBatch[] = [];
  const transactions: TransactionRecon[] = [];

  // ---- 1. Build the 82 non-featured affected refund/duplicate amounts ----
  // Discovery order 0..82 doubles as batch-fill order: it exactly matches
  // BATCH_PLAN slice order, and index < CONFIRMED_TRANSACTIONS is the
  // confirmed/high-confidence set; the remainder is the review set.
  const confirmedNonFeatured = CONFIRMED_TRANSACTIONS - 1; // 66 (featured fills 1 confirmed slot)
  const reviewCount = AFFECTED_TRANSACTIONS - CONFIRMED_TRANSACTIONS; // 16

  const rawConfirmed = Array.from({ length: confirmedNonFeatured }, () => randFloat(rng, 1200, 8800));
  const rawReview = Array.from({ length: reviewCount }, () => randFloat(rng, 1200, 8800));

  const targetConfirmedNonFeatured = CONFIRMED_DISCREPANCY - FEATURED.duplicateAdjustment; // 212,000
  const targetReview = POTENTIAL_EXPOSURE - CONFIRMED_DISCREPANCY; // 132,000

  const confirmedAmounts = scaleToExactSum(rawConfirmed, targetConfirmedNonFeatured);
  const reviewAmounts = scaleToExactSum(rawReview, targetReview);

  // Discovery-order array of { amount, confidence } — index 0 reserved for featured.
  const orderedAmounts: Array<{ amount: number; confidence: "confirmed" | "review" }> = [
    { amount: FEATURED.duplicateAdjustment, confidence: "confirmed" },
    ...confirmedAmounts.map((amount) => ({ amount, confidence: "confirmed" as const })),
    ...reviewAmounts.map((amount) => ({ amount, confidence: "review" as const })),
  ];

  // ---- 2. Settlement batches + merchant assignment ----
  const merchantByKey = new Map(merchants.map((m) => [m.id, m]));
  let cursor = 0;
  const batchIndexOfTxn: number[] = [];
  BATCH_PLAN.forEach((plan, batchIdx) => {
    const merchant = merchantByKey.get(plan.key)!;
    const batchId = randId(rng, "setl", 14);
    batches.push({
      id: batchId,
      merchantId: merchant.id,
      utr: utrFor(rng),
      createdAt: isoAt(incidentDate, INCIDENT_TIMES.confirmedVariance),
      status: plan.status,
      transactionIds: [],
    });
    for (let i = 0; i < plan.size; i++) {
      batchIndexOfTxn[cursor] = batchIdx;
      cursor++;
    }
  });

  // ---- 3. Materialize the 83 affected transactions ----
  const stageBounds = [
    { upto: 1, end: INCIDENT_TIMES.firstAnomaly }, // index 0 lands exactly at first anomaly
    { upto: 5, end: INCIDENT_TIMES.cumulative5 },
    { upto: 23, end: INCIDENT_TIMES.cumulative23 },
    { upto: 67, end: INCIDENT_TIMES.cumulative67 },
    { upto: 83, end: INCIDENT_TIMES.confirmedVariance },
  ];
  function timestampForIndex(i: number): string {
    if (i === 0) return isoAt(incidentDate, INCIDENT_TIMES.firstAnomaly);
    let prevBound = 0;
    let prevEnd = INCIDENT_TIMES.firstAnomaly;
    for (const stage of stageBounds) {
      if (i < stage.upto) {
        const t = (i - prevBound) / (stage.upto - prevBound);
        return minutesBetween(incidentDate, prevEnd, stage.end, t);
      }
      prevBound = stage.upto;
      prevEnd = stage.end;
    }
    return isoAt(incidentDate, INCIDENT_TIMES.confirmedVariance);
  }

  for (let i = 0; i < AFFECTED_TRANSACTIONS; i++) {
    const featured = i === 0;
    const batchIdx = batchIndexOfTxn[i];
    const batch = batches[batchIdx];
    const merchant = merchantByKey.get(batch.merchantId)!;
    const { amount: duplicateAdjustmentAmount, confidence } = orderedAmounts[i];

    const refundAmount = duplicateAdjustmentAmount;
    let paymentAmount: number;
    let fee: number;
    let tax: number;
    if (featured) {
      paymentAmount = FEATURED.paymentAmount;
      fee = FEATURED.fee;
      tax = FEATURED.tax;
    } else {
      const refundRatio = randFloat(rng, 0.15, 0.32);
      paymentAmount = Math.round(refundAmount / refundRatio / 50) * 50;
      fee = Math.round(paymentAmount * FEE_RATE);
      tax = Math.round(fee * TAX_RATE);
    }

    const createdAt = timestampForIndex(i);
    const orderId = randId(rng, "order", 14);
    const paymentId = randId(rng, "pay", 14);
    const refundId = randId(rng, "rfnd", 14);
    const adjustmentId = randId(rng, "adj", 14);
    const sharedReference = randId(rng, "RRN", 12);

    orders.push({
      id: orderId,
      merchantId: merchant.id,
      amount: paymentAmount,
      currency: "INR",
      createdAt,
      receipt: `rcpt_${orderId.slice(-8)}`,
    });
    payments.push({
      id: paymentId,
      orderId,
      merchantId: merchant.id,
      amount: paymentAmount,
      method: ["card", "upi", "netbanking", "wallet"][Math.floor(rng() * 4)] as Payment["method"],
      status: "captured",
      capturedAt: createdAt,
      utr: utrFor(rng),
    });
    refunds.push({
      id: refundId,
      paymentId,
      merchantId: merchant.id,
      amount: refundAmount,
      status: "processed",
      createdAt,
      reference: sharedReference,
      speed: rng() > 0.5 ? "instant" : "normal",
    });
    adjustments.push({
      id: adjustmentId,
      paymentId,
      merchantId: merchant.id,
      type: "duplicate_refund",
      amount: duplicateAdjustmentAmount,
      createdAt,
      reference: sharedReference,
      suspicious: true,
      linkedRefundId: refundId,
    });
    feesTaxes.push({ paymentId, merchantId: merchant.id, fee, tax });
    batch.transactionIds.push(paymentId);

    const expectedSettlement = paymentAmount - refundAmount - fee - tax;
    const actualSettlement = expectedSettlement - duplicateAdjustmentAmount;

    transactions.push({
      paymentId,
      orderId,
      refundId,
      merchantId: merchant.id,
      batchId: batch.id,
      paymentAmount,
      refundAmount,
      fee,
      tax,
      expectedSettlement,
      duplicateAdjustmentAmount,
      adjustmentId,
      actualSettlement,
      variance: expectedSettlement - actualSettlement,
      affected: true,
      confidence,
      createdAt,
      featured,
    });
  }

  // ---- 4. Lightweight normal (unaffected) transactions for baseline realism ----
  const normalSampleCount = 60; // representative sample kept as full entities
  for (let i = 0; i < normalSampleCount; i++) {
    const merchant = merchants[Math.floor(rng() * merchants.length)];
    const paymentAmount = Math.round(randInt(rng, 1500, 32000) / 50) * 50;
    const hasRefund = rng() < 0.18;
    const refundAmount = hasRefund ? Math.round(paymentAmount * randFloat(rng, 0.1, 0.4) / 10) * 10 : 0;
    const fee = Math.round(paymentAmount * FEE_RATE);
    const tax = Math.round(fee * TAX_RATE);
    const createdAt = minutesBetween(incidentDate, "09:00", INCIDENT_TIMES.normal, rng());
    const orderId = randId(rng, "order", 14);
    const paymentId = randId(rng, "pay", 14);
    const refundId = randId(rng, "rfnd", 14);

    orders.push({ id: orderId, merchantId: merchant.id, amount: paymentAmount, currency: "INR", createdAt, receipt: `rcpt_${orderId.slice(-8)}` });
    payments.push({
      id: paymentId,
      orderId,
      merchantId: merchant.id,
      amount: paymentAmount,
      method: ["card", "upi", "netbanking", "wallet"][Math.floor(rng() * 4)] as Payment["method"],
      status: "captured",
      capturedAt: createdAt,
      utr: utrFor(rng),
    });
    if (hasRefund) {
      refunds.push({ id: refundId, paymentId, merchantId: merchant.id, amount: refundAmount, status: "processed", createdAt, reference: randId(rng, "RRN", 12), speed: "normal" });
    }
    feesTaxes.push({ paymentId, merchantId: merchant.id, fee, tax });

    const expectedSettlement = paymentAmount - refundAmount - fee - tax;
    transactions.push({
      paymentId,
      orderId,
      refundId: hasRefund ? refundId : "",
      merchantId: merchant.id,
      batchId: "",
      paymentAmount,
      refundAmount,
      fee,
      tax,
      expectedSettlement,
      duplicateAdjustmentAmount: 0,
      adjustmentId: null,
      actualSettlement: expectedSettlement,
      variance: 0,
      affected: false,
      confidence: null,
      createdAt,
      featured: false,
    });
  }

  return {
    seed: SEED,
    generatedAt: new Date().toISOString(),
    incidentDate,
    merchants,
    orders,
    payments,
    refunds,
    adjustments,
    feesTaxes,
    batches,
    transactions,
  };
}
