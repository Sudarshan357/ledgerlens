import { AlertTriangle, CreditCard, Undo2, Receipt, Layers, Store } from "lucide-react";
import type { BlastNodeKind } from "@/lib/data/blastRadiusGraph";

export const BLAST_ICONS: Record<BlastNodeKind, typeof AlertTriangle> = {
  incident: AlertTriangle,
  transactions: CreditCard,
  refunds: Undo2,
  feesTaxes: Receipt,
  batch: Layers,
  merchant: Store,
};

/** Semantic colors, matching the app's existing token system — red stays the
 * strongest signal, everything else is a restrained, distinct accent. */
export const BLAST_COLOR_VAR: Record<BlastNodeKind, string> = {
  incident: "var(--brand-red)",
  transactions: "var(--accent-blue)",
  refunds: "var(--ink-400)",
  feesTaxes: "var(--accent-amber)",
  batch: "var(--blast-settlement)",
  merchant: "var(--accent-green)",
};

/** Sequential-reveal order on first mount: Center → Transactions → Refunds →
 * Settlement Batches → Merchants → Fees/Taxes (closes out total exposure). */
export const BLAST_REVEAL_ORDER: Record<BlastNodeKind, number> = {
  incident: 0,
  transactions: 1,
  refunds: 2,
  batch: 3,
  merchant: 4,
  feesTaxes: 5,
};

export const BLAST_REVEAL_TOTAL_MS = 950;
