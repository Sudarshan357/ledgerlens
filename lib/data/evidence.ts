import { getDataset } from "./generator";
import { formatCompactINR, formatINR, formatTime } from "../format";
import { BASELINE, INCIDENT_TIMES } from "./constants";

export interface EvidenceFact {
  id: string;
  statement: string;
  detail: string;
  category: "pattern" | "timing" | "scope" | "baseline" | "amount";
}

export function getEvidence(): EvidenceFact[] {
  const ds = getDataset();
  const affected = ds.transactions.filter((t) => t.affected);
  const confirmed = affected.filter((t) => t.confidence === "confirmed");
  const batchCount = new Set(affected.map((t) => t.batchId)).size;
  const merchantCount = new Set(affected.map((t) => t.merchantId)).size;
  const featured = affected.find((t) => t.featured)!;
  const firstTimeLabel = formatTime(featured.createdAt);

  const facts: EvidenceFact[] = [
    {
      id: "duplicate-reference",
      statement: "Duplicate refund reference reused as an adjustment reference",
      detail:
        `Every flagged adjustment carries the exact reference number of an already-processed refund on the same payment — ` +
        `${affected.length} adjustment records share a reference with an existing refund record, which should never happen ` +
        `under normal reconciliation rules.`,
      category: "pattern",
    },
    {
      id: "same-pattern",
      statement: `Same duplication pattern repeats across ${confirmed.length} transactions`,
      detail:
        `${confirmed.length} transactions show an identical signature: one genuine refund, followed by a second adjustment of the ` +
        `same amount against the same payment, referencing the same refund ID. Confidence is high enough to treat these as confirmed.`,
      category: "pattern",
    },
    {
      id: "batch-spread",
      statement: `Present in ${batchCount} settlement batches across ${merchantCount} merchants`,
      detail:
        `The pattern is not isolated to one merchant or one settlement run — it recurs across ${batchCount} settlement batches ` +
        `belonging to ${merchantCount} merchants, which points to a shared upstream cause rather than a merchant-side error.`,
      category: "scope",
    },
    {
      id: "first-occurrence",
      statement: `First occurrence detected at ${firstTimeLabel}`,
      detail:
        `Payment ${featured.paymentId} (₹${featured.paymentAmount.toLocaleString("en-IN")}) is the earliest confirmed instance — ` +
        `a genuine refund of ${formatINR(featured.refundAmount)} at ${firstTimeLabel}, immediately followed by a duplicate adjustment ` +
        `of the same amount referencing the same refund.`,
      category: "timing",
    },
    {
      id: "absent-previous-period",
      statement: "Absent in the previous reconciliation period",
      detail:
        `The prior settlement cycle recorded only ${BASELINE.anomalies} unrelated, low-value reconciliation notes and zero duplicate-reference ` +
        `adjustments. The pattern begins abruptly at ${INCIDENT_TIMES.firstAnomaly} with no earlier trace, consistent with a single triggering change ` +
        `rather than a gradual drift.`,
      category: "baseline",
    },
    {
      id: "exposure-amount",
      statement: `Confirmed impact of ${formatCompactINR(confirmed.reduce((a, t) => a + t.duplicateAdjustmentAmount, 0))} across confirmed records`,
      detail:
        `Summing the duplicate adjustment amount on every confirmed transaction yields a confirmed discrepancy of ` +
        `${formatINR(confirmed.reduce((a, t) => a + t.duplicateAdjustmentAmount, 0))}, computed directly from ledger records — not estimated.`,
      category: "amount",
    },
  ];

  return facts;
}
