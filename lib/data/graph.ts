import { getDataset } from "./generator";
import type { TransactionRecon } from "./types";
import {
  AFFECTED_BATCHES,
  AFFECTED_MERCHANTS,
  CONFIRMED_DISCREPANCY,
  FEE_RATE,
  POTENTIAL_EXPOSURE,
  TAX_RATE,
} from "./constants";

export type FlowNodeKind = "order" | "payment" | "refund" | "adjustment" | "feeTax" | "batch" | "merchant" | "exposure";

export type FocusState = "focused" | "hop1" | "hop2" | "dim" | undefined;

export interface FlowNodeData {
  kind: FlowNodeKind;
  label: string;
  primaryLine: string;
  secondaryLine?: string;
  statusLine?: string;
  amount?: number;
  suspicious?: boolean;
  confidence?: "confirmed" | "review" | null;
  meta?: Record<string, string | number>;
  revealIndex?: number;
}

export interface FlowNode {
  id: string;
  type: FlowNodeKind;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  suspicious?: boolean;
  animated?: boolean;
  label?: string;
  /** Short, human phrase describing what this connection represents — shown
   * only while the edge is focused (hover/pin), never by default. */
  relationshipLabel?: string;
}

export interface MoneyFlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  featuredTransactionId: string;
  suspiciousNodeIds: string[];
  suspiciousEdgeIds: string[];
  featuredChainNodeIds: string[];
}

const COL_X = {
  order: 0,
  payment: 260,
  refund: 560,
  adjustment: 560,
  feeTax: 560,
  batch: 920,
  merchant: 1220,
  exposure: 1520,
};

const ROW_H = 320;
const SUB_OFFSET = { refund: -100, adjustment: 0, feeTax: 100 };

const RELATIONSHIP_LABELS: Record<string, string> = {
  "order-payment": "payment for order",
  "payment-refund": "refund against payment",
  "payment-adjustment": "duplicate adjustment on payment",
  "payment-feeTax": "fee / tax deduction",
  "payment-batch": "included in settlement batch",
  "batch-merchant": "merchant payout",
  "merchant-exposure": "contributes to financial exposure",
};

export function getMoneyFlowGraph(): MoneyFlowGraph {
  const ds = getDataset();
  const merchantById = new Map(ds.merchants.map((m) => [m.id, m]));
  const batchById = new Map(ds.batches.map((b) => [b.id, b]));
  const paymentById = new Map(ds.payments.map((p) => [p.id, p]));
  const refundById = new Map(ds.refunds.map((r) => [r.id, r]));
  const orderById = new Map(ds.orders.map((o) => [o.id, o]));
  const affected = ds.transactions.filter((t) => t.affected);

  // One showcase transaction per affected merchant, always including featured.
  const showcase: TransactionRecon[] = [];
  const featured = affected.find((t) => t.featured)!;
  showcase.push(featured);
  for (const merchantId of ds.merchants.filter((m) => m.affected).map((m) => m.id)) {
    if (merchantId === featured.merchantId) continue;
    const pick = affected.find((t) => t.merchantId === merchantId && t.confidence === "confirmed") ??
      affected.find((t) => t.merchantId === merchantId)!;
    showcase.push(pick);
  }
  // Also surface one review-confidence transaction for visual contrast.
  const reviewSample = affected.find((t) => t.confidence === "review" && !showcase.includes(t));
  if (reviewSample) showcase.push(reviewSample);

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const suspiciousNodeIds: string[] = [];
  const suspiciousEdgeIds: string[] = [];

  function pushEdge(source: string, target: string, kindPairKey: string, extra?: Partial<FlowEdge>) {
    const id = `e-${kindPairKey}-${source}-${target}`;
    edges.push({ id, source, target, relationshipLabel: RELATIONSHIP_LABELS[kindPairKey], ...extra });
    return id;
  }

  showcase.forEach((t, row) => {
    const y = row * ROW_H;
    const merchant = merchantById.get(t.merchantId)!;
    const order = orderById.get(t.orderId);
    const payment = paymentById.get(t.paymentId);
    const refund = refundById.get(t.refundId);

    nodes.push({
      id: `order:${t.orderId}`,
      type: "order",
      position: { x: COL_X.order, y },
      data: {
        kind: "order",
        label: "Order",
        primaryLine: t.orderId,
        secondaryLine: `₹${t.paymentAmount.toLocaleString("en-IN")}`,
        amount: t.paymentAmount,
        meta: { merchant: merchant.name, currency: order?.currency ?? "INR", createdAt: t.createdAt },
      },
    });
    nodes.push({
      id: `payment:${t.paymentId}`,
      type: "payment",
      position: { x: COL_X.payment, y },
      data: {
        kind: "payment",
        label: "Payment",
        primaryLine: t.paymentId,
        secondaryLine: `₹${t.paymentAmount.toLocaleString("en-IN")}`,
        statusLine: "CAPTURED",
        amount: t.paymentAmount,
        meta: { merchant: merchant.name, method: payment?.method ?? "upi", capturedAt: t.createdAt },
      },
    });
    nodes.push({
      id: `refund:${t.refundId}`,
      type: "refund",
      position: { x: COL_X.refund, y: y + SUB_OFFSET.refund },
      data: {
        kind: "refund",
        label: "Refund",
        primaryLine: t.refundId,
        secondaryLine: `₹${t.refundAmount.toLocaleString("en-IN")}`,
        statusLine: "PROCESSED",
        amount: t.refundAmount,
        meta: { originalPayment: t.paymentId, speed: refund?.speed ?? "normal" },
      },
    });
    const adjNodeId = `adjustment:${t.adjustmentId}`;
    const review = t.confidence === "review";
    nodes.push({
      id: adjNodeId,
      type: "adjustment",
      position: { x: COL_X.adjustment, y: y + SUB_OFFSET.adjustment },
      data: {
        kind: "adjustment",
        label: "Adjustment",
        primaryLine: t.adjustmentId ?? "",
        secondaryLine: `₹${t.duplicateAdjustmentAmount.toLocaleString("en-IN")} · DUPLICATE`,
        amount: t.duplicateAdjustmentAmount,
        suspicious: true,
        confidence: t.confidence,
        meta: {
          relatedRefund: t.refundId,
          reason: "Duplicate refund reference detected within the settlement chain.",
          status: review ? "review" : "duplicate",
        },
      },
    });
    suspiciousNodeIds.push(adjNodeId);
    nodes.push({
      id: `feetax:${t.paymentId}`,
      type: "feeTax",
      position: { x: COL_X.feeTax, y: y + SUB_OFFSET.feeTax },
      data: {
        kind: "feeTax",
        label: "Fee + Tax",
        primaryLine: `₹${t.fee.toLocaleString("en-IN")} fee`,
        secondaryLine: `₹${t.tax.toLocaleString("en-IN")} GST`,
        amount: t.fee + t.tax,
        meta: { relatedPayment: t.paymentId, feeRate: `${(FEE_RATE * 100).toFixed(0)}%`, taxRate: `${(TAX_RATE * 100).toFixed(0)}%` },
      },
    });

    pushEdge(`order:${t.orderId}`, `payment:${t.paymentId}`, "order-payment");
    pushEdge(`payment:${t.paymentId}`, `refund:${t.refundId}`, "payment-refund");
    const adjEdgeId = pushEdge(`payment:${t.paymentId}`, adjNodeId, "payment-adjustment", {
      suspicious: true,
      animated: true,
      label: "duplicate",
    });
    suspiciousEdgeIds.push(adjEdgeId);
    pushEdge(`payment:${t.paymentId}`, `feetax:${t.paymentId}`, "payment-feeTax");
    pushEdge(`payment:${t.paymentId}`, `batch:${t.batchId}`, "payment-batch");
  });

  // Batch nodes — one per affected batch, positioned near the merchant row
  // that contributed a showcase transaction, offset if a merchant owns >1 batch.
  const merchantRow = new Map(showcase.map((t, i) => [t.merchantId, i]));
  const batchesByMerchant = new Map<string, string[]>();
  for (const b of ds.batches) {
    if (!b.transactionIds.length) continue;
    const list = batchesByMerchant.get(b.merchantId) ?? [];
    list.push(b.id);
    batchesByMerchant.set(b.merchantId, list);
  }
  for (const [merchantId, batchIds] of batchesByMerchant) {
    const baseRow = merchantRow.get(merchantId) ?? 0;
    batchIds.forEach((batchId, i) => {
      const batch = batchById.get(batchId)!;
      const flaggedCount = affected.filter((t) => t.batchId === batchId).length;
      const y = baseRow * ROW_H + i * 110 - ((batchIds.length - 1) * 55);
      nodes.push({
        id: `batch:${batchId}`,
        type: "batch",
        position: { x: COL_X.batch, y },
        data: {
          kind: "batch",
          label: "Settlement Batch",
          primaryLine: batch.utr,
          secondaryLine: `${flaggedCount} flagged`,
          statusLine: batch.status.toUpperCase(),
          suspicious: flaggedCount > 0,
          meta: { settlementId: batch.id, status: batch.status, flagged: flaggedCount },
        },
      });
      pushEdge(`batch:${batchId}`, `merchant:${merchantId}`, "batch-merchant");
    });
  }

  // Merchant nodes
  for (const [merchantId, row] of merchantRow) {
    const merchant = merchantById.get(merchantId)!;
    const impactCount = affected.filter((t) => t.merchantId === merchantId).length;
    nodes.push({
      id: `merchant:${merchantId}`,
      type: "merchant",
      position: { x: COL_X.merchant, y: row * ROW_H },
      data: {
        kind: "merchant",
        label: "Merchant",
        primaryLine: merchant.name,
        secondaryLine: `${impactCount} transactions affected`,
        suspicious: true,
        meta: { category: merchant.category, status: "flagged" },
      },
    });
    pushEdge(`merchant:${merchantId}`, "exposure:root", "merchant-exposure");
  }

  nodes.push({
    id: "exposure:root",
    type: "exposure",
    position: { x: COL_X.exposure, y: (showcase.length - 1) * ROW_H * 0.5 },
    data: {
      kind: "exposure",
      label: "Financial Exposure",
      primaryLine: `₹${CONFIRMED_DISCREPANCY.toLocaleString("en-IN")} confirmed`,
      secondaryLine: `₹${POTENTIAL_EXPOSURE.toLocaleString("en-IN")} potential`,
      suspicious: true,
      meta: { batches: AFFECTED_BATCHES, merchants: AFFECTED_MERCHANTS },
    },
  });

  nodes.forEach((n, i) => {
    n.data.revealIndex = i;
  });

  const featuredChainNodeIds = [
    `order:${featured.orderId}`,
    `payment:${featured.paymentId}`,
    `refund:${featured.refundId}`,
    `adjustment:${featured.adjustmentId}`,
    `feetax:${featured.paymentId}`,
    `batch:${featured.batchId}`,
  ];

  return {
    nodes,
    edges,
    featuredTransactionId: featured.paymentId,
    suspiciousNodeIds,
    suspiciousEdgeIds,
    featuredChainNodeIds,
  };
}
