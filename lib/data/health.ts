import { getDataset } from "./generator";
import { AFFECTED_TRANSACTIONS, BASELINE, POTENTIAL_EXPOSURE, REVIEW_EXPOSURE } from "./constants";

export interface HealthMetrics {
  settlementHealthPct: number;
  reconciliationRatePct: number;
  openInvestigations: number;
  unexplainedExposure: number;
}

export function getHealthMetrics(): HealthMetrics {
  const ds = getDataset();
  const totalPaymentValue = ds.transactions.reduce((a, t) => a + t.paymentAmount, 0);
  const avgPaymentValue = totalPaymentValue / ds.transactions.length;
  const periodTransactionCount = BASELINE.normalTransactionCount + AFFECTED_TRANSACTIONS;
  const estimatedPeriodValue = avgPaymentValue * periodTransactionCount;

  const settlementHealthPct = 100 - (POTENTIAL_EXPOSURE / estimatedPeriodValue) * 100;
  const reconciliationRatePct = ((periodTransactionCount - AFFECTED_TRANSACTIONS) / periodTransactionCount) * 100;

  return {
    settlementHealthPct,
    reconciliationRatePct,
    openInvestigations: 1,
    unexplainedExposure: REVIEW_EXPOSURE,
  };
}
