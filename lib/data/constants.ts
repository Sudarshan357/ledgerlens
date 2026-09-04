// Ground-truth incident numbers. Every derived figure in the app (evidence
// counts, blast radius, recovery simulation, before/after deltas) is computed
// FROM the generated dataset, but the dataset itself is constructed to land
// exactly on these target totals so the storyline matches the brief.

export const SEED = "ledgerlens-incident-2026-09-03";

export const AFFECTED_TRANSACTIONS = 83;
export const CONFIRMED_TRANSACTIONS = 67;
export const REVIEW_TRANSACTIONS = 16; // AFFECTED - CONFIRMED

export const CONFIRMED_DISCREPANCY = 214_000; // ₹2.14L
export const POTENTIAL_EXPOSURE = 346_000; // ₹3.46L
export const REVIEW_EXPOSURE = POTENTIAL_EXPOSURE - CONFIRMED_DISCREPANCY; // ₹1.32L

export const AFFECTED_BATCHES = 6;
export const AFFECTED_MERCHANTS = 4;

export const FEE_RATE = 0.02; // platform fee as % of payment
export const TAX_RATE = 0.18; // GST on fee

// The canonical example transaction quoted throughout the product story.
export const FEATURED = {
  paymentAmount: 10_000,
  refundAmount: 2_000,
  fee: 200,
  tax: 36,
  get expectedSettlement() {
    return this.paymentAmount - this.refundAmount - this.fee - this.tax;
  },
  duplicateAdjustment: 2_000,
  get actualSettlement() {
    return this.expectedSettlement - this.duplicateAdjustment;
  },
};

// Batch plan: sizes sum to AFFECTED_TRANSACTIONS, merchant keys map to the
// 4 affected merchants defined in generator.ts.
export const BATCH_PLAN = [
  { key: "M1", size: 18, status: "settled" as const },
  { key: "M1", size: 16, status: "settled" as const },
  { key: "M2", size: 14, status: "settled" as const },
  { key: "M2", size: 13, status: "settled" as const },
  { key: "M3", size: 12, status: "settled" as const }, // half confirmed, half review
  { key: "M4", size: 10, status: "processing" as const }, // all review
];

// Baseline ("previous period") figures — small, healthy noise unrelated to
// the incident, used purely for the Before/After comparison.
export const BASELINE = {
  normalTransactionCount: 452,
  normalRefundCount: 78,
  failedPayments: 11,
  variance: 1_840,
  anomalies: 2,
  exposure: 0,
  incidentFailedPaymentsDelta: 3,
};

export const INCIDENT_TIMES = {
  normal: "14:12",
  firstAnomaly: "14:32",
  cumulative5: "14:41",
  cumulative23: "15:02",
  cumulative67: "15:34",
  confirmedVariance: "16:10",
};
