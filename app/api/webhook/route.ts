import { NextResponse } from "next/server";
import { getWebhookFeed, simulateWebhookEvent, type WebhookEventType } from "@/lib/razorpay/webhookSimulator";

const VALID_EVENTS: WebhookEventType[] = ["payment.captured", "refund.processed", "settlement.processed"];

export async function GET() {
  return NextResponse.json({ events: getWebhookFeed() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const event = body?.event;
  if (!VALID_EVENTS.includes(event)) {
    return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
  }
  const entry = simulateWebhookEvent(event);
  return NextResponse.json({ entry, events: getWebhookFeed() });
}
