import { getDataset } from "./generator";
import { CONFIRMED_DISCREPANCY, CONFIRMED_TRANSACTIONS, POTENTIAL_EXPOSURE, REVIEW_TRANSACTIONS } from "./constants";
import type { TransactionRecon } from "./types";

export interface MerchantImpact {
  merchantId: string;
  name: string;
  category: string;
  transactionCount: number;
  batchCount: number;
  amount: number;
}

export interface BatchImpact {
  batchId: string;
  utr: string;
  merchantId: string;
  merchantName: string;
  status: "settled" | "processing";
  transactionCount: number;
  amount: number;
}

export interface BlastRadius {
  affectedTransactions: number;
  confirmedTransactionCount: number;
  reviewTransactionCount: number;
  affectedBatches: number;
  affectedMerchants: number;
  confirmedDiscrepancy: number;
  potentialExposure: number;
  reviewExposure: number;
  topMerchants: MerchantImpact[];
  topBatches: BatchImpact[];
  largestTransactions: (TransactionRecon & { merchantName: string })[];
}

export function getBlastRadius(): BlastRadius {
  const ds = getDataset();
  const affected = ds.transactions.filter((t) => t.affected);
  const merchantById = new Map(ds.merchants.map((m) => [m.id, m]));
  const batchById = new Map(ds.batches.map((b) => [b.id, b]));

  const merchantMap = new Map<string, MerchantImpact>();
  for (const t of affected) {
    const m = merchantById.get(t.merchantId)!;
    const entry = merchantMap.get(m.id) ?? {
      merchantId: m.id,
      name: m.name,
      category: m.category,
      transactionCount: 0,
      batchCount: 0,
      amount: 0,
    };
    entry.transactionCount += 1;
    entry.amount += t.duplicateAdjustmentAmount;
    merchantMap.set(m.id, entry);
  }
  for (const entry of merchantMap.values()) {
    entry.batchCount = new Set(affected.filter((t) => t.merchantId === entry.merchantId).map((t) => t.batchId)).size;
  }

  const batchMap = new Map<string, BatchImpact>();
  for (const t of affected) {
    const b = batchById.get(t.batchId)!;
    const m = merchantById.get(t.merchantId)!;
    const entry = batchMap.get(b.id) ?? {
      batchId: b.id,
      utr: b.utr,
      merchantId: m.id,
      merchantName: m.name,
      status: b.status,
      transactionCount: 0,
      amount: 0,
    };
    entry.transactionCount += 1;
    entry.amount += t.duplicateAdjustmentAmount;
    batchMap.set(b.id, entry);
  }

  const largestTransactions = [...affected]
    .sort((a, b) => b.duplicateAdjustmentAmount - a.duplicateAdjustmentAmount)
    .slice(0, 8)
    .map((t) => ({ ...t, merchantName: merchantById.get(t.merchantId)!.name }));

  return {
    affectedTransactions: affected.length,
    confirmedTransactionCount: CONFIRMED_TRANSACTIONS,
    reviewTransactionCount: REVIEW_TRANSACTIONS,
    affectedBatches: batchMap.size,
    affectedMerchants: merchantMap.size,
    confirmedDiscrepancy: CONFIRMED_DISCREPANCY,
    potentialExposure: POTENTIAL_EXPOSURE,
    reviewExposure: POTENTIAL_EXPOSURE - CONFIRMED_DISCREPANCY,
    topMerchants: [...merchantMap.values()].sort((a, b) => b.amount - a.amount),
    topBatches: [...batchMap.values()].sort((a, b) => b.amount - a.amount),
    largestTransactions,
  };
}
