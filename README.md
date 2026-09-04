# LedgerLens

**AI Financial Incident Investigator** — built for the Razorpay AI Buildathon.

**Live demo:** [ledgerlens-gules.vercel.app](https://ledgerlens-gules.vercel.app/)

> When money doesn't add up, find out why.

LedgerLens is not a reconciliation dashboard or a fraud detector. It's a financial
incident investigation layer: when settlement figures stop adding up, it reconstructs
the transaction chain, builds a visual money-flow graph, isolates the root cause,
measures the financial blast radius, and produces a reviewable, evidence-backed
recovery plan — without moving any real money.

## The demo incident

The app ships with a deterministic synthetic dataset (orders, payments, refunds, fees,
taxes, adjustments, settlement batches, merchants, UTR-like references) with a
duplicate refund-adjustment pattern injected into it:

| | |
|---|---|
| Confirmed discrepancy | ₹2.14L across 67 high-confidence transactions |
| Potential exposure | ₹3.46L including 16 transactions held for review |
| Scope | 83 transactions · 6 settlement batches · 4 merchants |
| Confidence | 96% |

Every figure in the UI is *derived* from the generated ledger (`lib/data/generator.ts`),
not hard-coded prose — `npx tsx scripts/verify-dataset.ts` re-derives the totals from
the raw transaction records and checks them against the target numbers.

## Architecture

```
Synthetic ledger (lib/data/generator.ts)
  → Reconciliation (expected vs. actual settlement, per transaction)
  → Anomaly + relationship detection (lib/data/evidence.ts)
  → Root cause + incident summary (lib/data/incident.ts)
  → Financial blast radius (lib/data/blastRadius.ts)
  → AI narrative synthesis (lib/ai/investigator.ts)
  → Recovery simulation (lib/data/recovery.ts) — simulation only, no funds move
  → Audit trail (lib/data/audit.ts)
```

**Deterministic code owns every number.** All monetary values, counts, and evidence
facts are computed from the dataset. The AI investigator (`lib/ai/investigator.ts`)
only turns that verified evidence into prose — a root-cause narrative and a
recommendation — and is given the evidence as its only source of truth. It never
sees, and cannot invent, a monetary figure. Without an `ANTHROPIC_API_KEY` it falls
back to a deterministic template narrative, so the product works fully offline.

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables or
credentials are required — the app runs entirely on the synthetic dataset above.

Click **Run Incident Simulation** on the Overview page to watch the full
investigation play out automatically: money-flow graph → evidence → blast radius →
before/after → timeline → recovery simulation.

Other useful scripts:

```bash
npm run lint                       # ESLint
npx tsx scripts/verify-dataset.ts  # re-derive incident totals from the raw ledger
npx tsx scripts/verify-derived.ts  # dump every derived view for manual inspection
```

## Optional integrations

Copy `.env.example` to `.env.local` to enable either of these — both are optional
and the app is fully functional without them:

- `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) — lets the AI Investigator phrase the
  investigation summary with a live model call instead of the offline template.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — enables optional cross-checking against
  Razorpay **Test Mode** settlements (`lib/razorpay/client.ts`). Never point these at
  a live/production key.

A webhook simulator (`payment.captured`, `refund.processed`, `settlement.processed`)
is available on the Money Flow page and posts to `app/api/webhook/route.ts` — it
never moves money or mutates the dataset, it only appends a Razorpay-style payload to
an in-memory feed the UI renders as live activity.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Flow · Framer Motion ·
Lucide icons. No database — the dataset is generated in-memory from a fixed seed, so
the demo is deterministic and repeatable on every run.
