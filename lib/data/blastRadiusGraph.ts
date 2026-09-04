import { getDataset } from "./generator";
import { getBlastRadius } from "./blastRadius";
import {
  AFFECTED_TRANSACTIONS,
  CONFIRMED_DISCREPANCY,
  CONFIRMED_TRANSACTIONS,
  POTENTIAL_EXPOSURE,
  REVIEW_TRANSACTIONS,
} from "./constants";

export type BlastNodeKind = "incident" | "transactions" | "refunds" | "feesTaxes" | "batch" | "merchant";

export interface BlastNode {
  id: string;
  kind: BlastNodeKind;
  label: string;
  primaryLine: string;
  amount?: number;
  count?: number;
  meta: Record<string, string | number>;
}

export interface BlastEdge {
  id: string;
  source: string;
  target: string;
}

export interface BlastRadiusGraph {
  nodes: BlastNode[];
  edges: BlastEdge[];
  centerNodeId: string;
}

/**
 * A graph-shaped view of the SAME numbers `getBlastRadius()` already
 * computes and verifies — this module adds no new financial calculations.
 * The only two genuinely new aggregates (`totalRefundAmount`,
 * `totalFeesAndTaxes`) are plain sums of fields that already exist on every
 * affected `TransactionRecon` row, computed fresh here rather than
 * hardcoded, so they can never drift from the underlying ledger.
 */
export function getBlastRadiusGraph(): BlastRadiusGraph {
  const ds = getDataset();
  const blast = getBlastRadius();
  const affected = ds.transactions.filter((t) => t.affected);
  const featured = affected.find((t) => t.featured)!;

  const totalRefundAmount = affected.reduce((a, t) => a + t.refundAmount, 0);
  const totalFeesAndTaxes = affected.reduce((a, t) => a + t.fee + t.tax, 0);

  const nodes: BlastNode[] = [];
  const edges: BlastEdge[] = [];

  nodes.push({
    id: "incident",
    kind: "incident",
    label: "Duplicate Adjustment",
    primaryLine: `Pattern across ${AFFECTED_TRANSACTIONS} records`,
    amount: CONFIRMED_DISCREPANCY,
    meta: { confidence: 96, firstOccurrence: featured.adjustmentId ?? "" },
  });

  nodes.push({
    id: "group:transactions",
    kind: "transactions",
    label: "Transactions",
    primaryLine: `${AFFECTED_TRANSACTIONS} affected`,
    count: AFFECTED_TRANSACTIONS,
    amount: POTENTIAL_EXPOSURE,
    meta: { confirmed: CONFIRMED_TRANSACTIONS, review: REVIEW_TRANSACTIONS },
  });
  edges.push({ id: "e-incident-transactions", source: "incident", target: "group:transactions" });

  nodes.push({
    id: "group:refunds",
    kind: "refunds",
    label: "Refunds",
    primaryLine: `${AFFECTED_TRANSACTIONS} duplicated`,
    count: AFFECTED_TRANSACTIONS,
    amount: totalRefundAmount,
    meta: {},
  });
  edges.push({ id: "e-incident-refunds", source: "incident", target: "group:refunds" });

  nodes.push({
    id: "group:feesTaxes",
    kind: "feesTaxes",
    label: "Fees / Taxes",
    primaryLine: `${affected.length} records`,
    count: affected.length,
    amount: totalFeesAndTaxes,
    meta: {},
  });
  edges.push({ id: "e-incident-feesTaxes", source: "incident", target: "group:feesTaxes" });

  for (const b of blast.topBatches) {
    const id = `batch:${b.batchId}`;
    nodes.push({
      id,
      kind: "batch",
      label: "Batch",
      primaryLine: b.utr,
      amount: b.amount,
      count: b.transactionCount,
      meta: { status: b.status, merchant: b.merchantName, batchId: b.batchId },
    });
    edges.push({ id: `e-incident-${id}`, source: "incident", target: id });
  }

  for (const m of blast.topMerchants) {
    const id = `merchant:${m.merchantId}`;
    nodes.push({
      id,
      kind: "merchant",
      label: "Merchant",
      primaryLine: m.name,
      amount: m.amount,
      count: m.transactionCount,
      meta: { batches: m.batchCount, category: m.category },
    });
    edges.push({ id: `e-incident-${id}`, source: "incident", target: id });
  }

  return { nodes, edges, centerNodeId: "incident" };
}
