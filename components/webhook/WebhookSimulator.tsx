"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, CreditCard, Undo2, Landmark, AlertCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SimulatedWebhookEvent, WebhookEventType } from "@/lib/razorpay/webhookSimulator";

const EVENTS: { type: WebhookEventType; label: string; icon: typeof CreditCard }[] = [
  { type: "payment.captured", label: "payment.captured", icon: CreditCard },
  { type: "refund.processed", label: "refund.processed", icon: Undo2 },
  { type: "settlement.processed", label: "settlement.processed", icon: Landmark },
];

export function WebhookSimulator() {
  const [feed, setFeed] = useState<SimulatedWebhookEvent[]>([]);
  const [loading, setLoading] = useState<WebhookEventType | null>(null);
  const [error, setError] = useState<WebhookEventType | null>(null);

  async function fire(type: WebhookEventType) {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: type }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.events) setFeed(data.events.slice(0, 4));
    } catch {
      setError(type);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-4 p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <Zap className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
        Webhook Simulator
      </div>
      <div className="flex flex-wrap gap-2">
        {EVENTS.map((e) => (
          <Button key={e.type} variant="secondary" size="sm" onClick={() => fire(e.type)} disabled={loading === e.type}>
            <e.icon className="h-3 w-3" />
            {e.label}
          </Button>
        ))}
      </div>
      <div className="flex min-h-[22px] flex-1 items-center gap-2 overflow-hidden">
        {error && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-red-200 bg-brand-red-50 px-2 py-0.5 text-[10px] font-medium text-brand-red">
            <AlertCircle className="h-3 w-3" strokeWidth={2.3} />
            Webhook delivery failed
            <button
              onClick={() => fire(error)}
              className="ml-1 inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-brand-red-600"
            >
              <RotateCcw className="h-2.5 w-2.5" strokeWidth={2.5} />
              Retry
            </button>
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {feed.map((entry) => (
            <motion.span
              key={entry.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-border-default bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-500"
            >
              {entry.event} · {entry.id}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
