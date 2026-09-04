// In-memory webhook event simulator. Demo-only: it never moves money or
// mutates the underlying dataset — it produces a Razorpay-style payload and
// appends it to a session-local feed the UI can render as "live" activity.

import { randId, mulberry32 } from "../data/rng";
import { getDataset } from "../data/generator";

export type WebhookEventType = "payment.captured" | "refund.processed" | "settlement.processed";

export interface SimulatedWebhookEvent {
  id: string;
  event: WebhookEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

const feed: SimulatedWebhookEvent[] = [];
let counter = 0;

export function getWebhookFeed(): SimulatedWebhookEvent[] {
  return feed;
}

export function simulateWebhookEvent(event: WebhookEventType): SimulatedWebhookEvent {
  const ds = getDataset();
  counter += 1;
  const rng = mulberry32(Date.now() ^ counter);
  const sample = ds.transactions[Math.floor(rng() * ds.transactions.length)];

  let payload: Record<string, unknown>;
  switch (event) {
    case "payment.captured":
      payload = {
        id: randId(rng, "pay", 14),
        order_id: sample.orderId,
        amount: sample.paymentAmount * 100,
        currency: "INR",
        status: "captured",
        method: "upi",
      };
      break;
    case "refund.processed":
      payload = {
        id: randId(rng, "rfnd", 14),
        payment_id: sample.paymentId,
        amount: sample.refundAmount * 100,
        status: "processed",
      };
      break;
    case "settlement.processed":
      payload = {
        id: randId(rng, "setl", 14),
        amount: sample.expectedSettlement * 100,
        status: "processed",
        utr: randId(rng, "UTR", 11),
      };
      break;
  }

  const entry: SimulatedWebhookEvent = {
    id: randId(rng, "evt", 12),
    event,
    createdAt: new Date().toISOString(),
    payload,
  };
  feed.unshift(entry);
  if (feed.length > 20) feed.length = 20;
  return entry;
}
