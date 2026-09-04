// Core entity + derived types for the LedgerLens synthetic ledger.
// All monetary fields are integer rupees.

export type ID = string;

export type Confidence = "confirmed" | "review" | null;

export interface Merchant {
  id: ID;
  name: string;
  category: string;
  vpa: string;
  affected: boolean;
}

export interface Order {
  id: ID;
  merchantId: ID;
  amount: number;
  currency: "INR";
  createdAt: string;
  receipt: string;
}

export interface Payment {
  id: ID;
  orderId: ID;
  merchantId: ID;
  amount: number;
  method: "card" | "upi" | "netbanking" | "wallet";
  status: "captured";
  capturedAt: string;
  utr: string;
}

export interface Refund {
  id: ID;
  paymentId: ID;
  merchantId: ID;
  amount: number;
  status: "processed";
  createdAt: string;
  reference: string;
  speed: "normal" | "instant";
}

export type AdjustmentType = "duplicate_refund" | "chargeback" | "correction";

export interface Adjustment {
  id: ID;
  paymentId: ID;
  merchantId: ID;
  type: AdjustmentType;
  amount: number;
  createdAt: string;
  reference: string;
  suspicious: boolean;
  linkedRefundId: ID;
}

export interface FeeTax {
  paymentId: ID;
  merchantId: ID;
  fee: number;
  tax: number;
}

export interface SettlementBatch {
  id: ID;
  merchantId: ID;
  utr: string;
  createdAt: string;
  status: "settled" | "processing";
  transactionIds: ID[];
}

/** Fully joined, reconciled view of a single payment — one row per transaction. */
export interface TransactionRecon {
  paymentId: ID;
  orderId: ID;
  refundId: ID;
  merchantId: ID;
  batchId: ID;
  paymentAmount: number;
  refundAmount: number;
  fee: number;
  tax: number;
  expectedSettlement: number;
  duplicateAdjustmentAmount: number;
  adjustmentId: ID | null;
  actualSettlement: number;
  variance: number;
  affected: boolean;
  confidence: Confidence;
  createdAt: string;
  featured: boolean;
}

export interface Dataset {
  seed: string;
  generatedAt: string;
  incidentDate: string;
  merchants: Merchant[];
  orders: Order[];
  payments: Payment[];
  refunds: Refund[];
  adjustments: Adjustment[];
  feesTaxes: FeeTax[];
  batches: SettlementBatch[];
  transactions: TransactionRecon[];
}
