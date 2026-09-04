import { AFFECTED_TRANSACTIONS, BASELINE, CONFIRMED_DISCREPANCY, POTENTIAL_EXPOSURE } from "./constants";

export interface StateSnapshot {
  label: string;
  transactions: number;
  refunds: number;
  failedPayments: number;
  variance: number;
  anomalies: number;
  exposure: number;
}

export interface Comparison {
  previous: StateSnapshot;
  current: StateSnapshot;
}

export function getComparison(): Comparison {
  const normalCount = BASELINE.normalTransactionCount;

  const previous: StateSnapshot = {
    label: "Previous period",
    transactions: normalCount,
    refunds: BASELINE.normalRefundCount,
    failedPayments: BASELINE.failedPayments,
    variance: BASELINE.variance,
    anomalies: BASELINE.anomalies,
    exposure: BASELINE.exposure,
  };

  const current: StateSnapshot = {
    label: "Current period",
    transactions: normalCount + AFFECTED_TRANSACTIONS,
    refunds: BASELINE.normalRefundCount + AFFECTED_TRANSACTIONS,
    failedPayments: BASELINE.failedPayments + BASELINE.incidentFailedPaymentsDelta,
    variance: CONFIRMED_DISCREPANCY,
    anomalies: AFFECTED_TRANSACTIONS,
    exposure: POTENTIAL_EXPOSURE,
  };

  return { previous, current };
}
