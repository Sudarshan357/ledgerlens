// AI Investigator abstraction.
//
// Deterministic code (lib/data/*) computes every monetary figure, entity
// count, and evidence fact. This module ONLY turns that structured evidence
// into prose — narrative synthesis, root-cause interpretation, and a
// recommended next action. It never invents a number: every figure it
// mentions is interpolated from the evidence object it is given.
//
// When ANTHROPIC_API_KEY is present, it asks the model to phrase the
// narrative (still grounded strictly in the supplied evidence). Without a
// key — the default for this hackathon build — it falls back to a
// deterministic template so the product works fully offline.

import type { IncidentSummary } from "../data/incident";
import type { EvidenceFact } from "../data/evidence";
import type { Comparison } from "../data/compare";
import { formatCompactINR, formatTime } from "../format";
import { INCIDENT_TIMES } from "../data/constants";

export interface InvestigatorEvidenceContext {
  incident: IncidentSummary;
  evidence: EvidenceFact[];
}

export interface InvestigatorNarrative {
  summary: string;
  recommendation: string;
  source: "template" | "model";
}

export interface ComparisonNarrative {
  explanation: string;
  source: "template" | "model";
}

function buildTemplateNarrative(ctx: InvestigatorEvidenceContext): InvestigatorNarrative {
  const { incident, evidence } = ctx;
  const first = formatTime(incident.firstOccurrenceAt);
  const confirmedAt = formatTime(incident.confirmedAt);

  const summary =
    `A duplicate refund adjustment first appeared at ${first} and was confirmed at ${confirmedAt}. ` +
    `${evidence.length} independent evidence facts corroborate the same signature: a genuine refund followed by a second, ` +
    `duplicate adjustment referencing that refund's ID, which silently deducts the refund amount from settlement a second time. ` +
    `The pattern now spans ${incident.confirmedTransactionCount} confirmed transactions across ${incident.affectedBatches} settlement ` +
    `batches and ${incident.affectedMerchants} merchants, producing a confirmed discrepancy of ${formatCompactINR(incident.confirmedDiscrepancy)}. ` +
    `A further ${incident.reviewTransactionCount} transactions in a settlement batch that has not yet finished processing show the same ` +
    `signature at lower confidence, putting potential exposure at ${formatCompactINR(incident.potentialExposure)}. ` +
    `The pattern is absent from the previous reconciliation period, which points to a single triggering change rather than gradual drift.`;

  const recommendation =
    `Reverse the duplicate adjustment on all ${incident.confirmedTransactionCount} confirmed transactions — the evidence confidence (${incident.confidence}%) ` +
    `supports automatic correction. Hold the remaining ${incident.reviewTransactionCount} transactions for human review before correcting, since their ` +
    `settlement batch is still processing and the adjustment cannot yet be independently verified. No funds should move until a reviewer approves the batch.`;

  return { summary, recommendation, source: "template" };
}

async function callAnthropic(ctx: InvestigatorEvidenceContext): Promise<InvestigatorNarrative | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const evidenceBlock = ctx.evidence.map((e) => `- ${e.statement}: ${e.detail}`).join("\n");

  const system =
    "You are a financial incident investigator writing an internal report. You are given verified, deterministic evidence " +
    "and must ONLY restate and interpret it in clear prose. Never invent a monetary figure, count, or timestamp that is not " +
    "present in the evidence provided. Return strict JSON: {\"summary\": string, \"recommendation\": string}.";

  const user =
    `Incident: ${ctx.incident.title}\n` +
    `Confirmed discrepancy: ${formatCompactINR(ctx.incident.confirmedDiscrepancy)}\n` +
    `Potential exposure: ${formatCompactINR(ctx.incident.potentialExposure)}\n` +
    `Affected transactions: ${ctx.incident.affectedTransactions} (${ctx.incident.confirmedTransactionCount} confirmed, ${ctx.incident.reviewTransactionCount} under review)\n` +
    `Affected settlement batches: ${ctx.incident.affectedBatches}\n` +
    `Affected merchants: ${ctx.incident.affectedMerchants}\n` +
    `Confidence: ${ctx.incident.confidence}%\n\n` +
    `Evidence:\n${evidenceBlock}\n\n` +
    `Write a concise (3-5 sentence) investigation summary and a one-sentence recommendation. JSON only.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed.summary || !parsed.recommendation) return null;
    return { summary: parsed.summary, recommendation: parsed.recommendation, source: "model" };
  } catch {
    return null;
  }
}

export async function generateInvestigationNarrative(
  ctx: InvestigatorEvidenceContext,
): Promise<InvestigatorNarrative> {
  const modelResult = await callAnthropic(ctx);
  return modelResult ?? buildTemplateNarrative(ctx);
}

export function generateInvestigationNarrativeSync(ctx: InvestigatorEvidenceContext): InvestigatorNarrative {
  return buildTemplateNarrative(ctx);
}

// Before/After comparison narrative — same evidence-grounded pattern as
// above, applied to the structured previous/current snapshot instead of the
// evidence list. It never receives a raw number to invent from scratch: every
// figure it can mention is already present in `comparison`.

function buildTemplateComparisonNarrative(comparison: Comparison): ComparisonNarrative {
  const { previous, current } = comparison;
  const explanation =
    `Anomalies rose from ${previous.anomalies} to ${current.anomalies} and variance from ${formatCompactINR(previous.variance)} to ` +
    `${formatCompactINR(current.variance)} after ${INCIDENT_TIMES.firstAnomaly}, accounting for the majority of the ` +
    `${formatCompactINR(current.exposure)} current exposure.`;

  return { explanation, source: "template" };
}

async function callAnthropicForComparison(comparison: Comparison): Promise<ComparisonNarrative | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const { previous, current } = comparison;

  const system =
    "You are a financial incident investigator writing an internal report. You are given verified, deterministic " +
    "previous-vs-current period figures and must ONLY restate and interpret them in one concise sentence. Never invent " +
    "a monetary figure, count, or timestamp that is not present in the data provided. Return strict JSON: " +
    '{"explanation": string}.';

  const user =
    `First anomaly detected at ${INCIDENT_TIMES.firstAnomaly}.\n` +
    `Previous period: ${previous.transactions} transactions, ${previous.refunds} refunds, ${previous.failedPayments} failed payments, ` +
    `${formatCompactINR(previous.variance)} variance, ${previous.anomalies} anomalies, ${formatCompactINR(previous.exposure)} exposure.\n` +
    `Current period: ${current.transactions} transactions, ${current.refunds} refunds, ${current.failedPayments} failed payments, ` +
    `${formatCompactINR(current.variance)} variance, ${current.anomalies} anomalies, ${formatCompactINR(current.exposure)} exposure.\n\n` +
    `Write one concise sentence explaining what changed and why. JSON only.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed.explanation) return null;
    return { explanation: parsed.explanation, source: "model" };
  } catch {
    return null;
  }
}

export async function generateComparisonNarrative(comparison: Comparison): Promise<ComparisonNarrative> {
  const modelResult = await callAnthropicForComparison(comparison);
  return modelResult ?? buildTemplateComparisonNarrative(comparison);
}
