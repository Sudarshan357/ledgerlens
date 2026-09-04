import { getDataset } from "./generator";
import { CONFIRMED_DISCREPANCY, CONFIRMED_TRANSACTIONS, REVIEW_TRANSACTIONS } from "./constants";

export interface RecoveryStage {
  label: string;
  variance: number;
  percentCorrected: number;
}

export interface RecoveryPlan {
  startingVariance: number;
  stages: RecoveryStage[];
  autoCorrectable: number;
  requiresReview: number;
}

/**
 * Every stage is a real cumulative-correction checkpoint derived from the six
 * settlement batches in the ledger: each settled batch's confirmed-only
 * duplicate-adjustment total is subtracted from the starting variance, in
 * settlement order. The one batch still "processing" (Nimbus Mart) holds
 * zero confirmed transactions, so it contributes no stage — its transactions
 * stay in `requiresReview` instead of being folded into an auto-correction
 * step. Stages therefore always land on exactly zero with no rounding fudge,
 * and every intermediate number traces back to a real batch also shown in
 * Blast Radius and Money Flow.
 */
export function getRecoveryPlan(): RecoveryPlan {
  const ds = getDataset();
  const merchantById = new Map(ds.merchants.map((m) => [m.id, m]));
  const startingVariance = CONFIRMED_DISCREPANCY;

  const settledBatches = ds.batches.filter((b) => b.transactionIds.length > 0 && b.status === "settled");

  const stages: RecoveryStage[] = [
    { label: "Current variance", variance: startingVariance, percentCorrected: 0 },
  ];

  let cumulative = 0;
  settledBatches.forEach((batch) => {
    const confirmedSum = ds.transactions
      .filter((t) => t.batchId === batch.id && t.confidence === "confirmed")
      .reduce((a, t) => a + t.duplicateAdjustmentAmount, 0);
    if (confirmedSum === 0) return;

    cumulative += confirmedSum;
    const remaining = Math.max(startingVariance - cumulative, 0);
    const isLast = remaining === 0;
    const merchant = merchantById.get(batch.merchantId)!;
    const ordinal = stages.length; // 1-based correction step number

    stages.push({
      label: isLast
        ? "Fully corrected"
        : `${merchant.name} — settlement ${ordinal} of ${settledBatches.length} corrected`,
      variance: remaining,
      percentCorrected: isLast ? 100 : Math.round((cumulative / startingVariance) * 100),
    });
  });

  return {
    startingVariance,
    stages,
    autoCorrectable: CONFIRMED_TRANSACTIONS,
    requiresReview: REVIEW_TRANSACTIONS,
  };
}
