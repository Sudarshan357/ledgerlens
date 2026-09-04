import { getDataset } from "./generator";
import { AFFECTED_BATCHES, AFFECTED_MERCHANTS, AFFECTED_TRANSACTIONS, CONFIRMED_DISCREPANCY, CONFIRMED_TRANSACTIONS, INCIDENT_TIMES, POTENTIAL_EXPOSURE, REVIEW_TRANSACTIONS } from "./constants";
import { formatCompactINR } from "../format";

export interface AuditEvent {
  id: string;
  time: string;
  isoTime: string;
  actor: string;
  action: string;
  detail: string;
}

export function getAuditTrail(): AuditEvent[] {
  const ds = getDataset();
  const isoAt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const base = new Date(`${ds.incidentDate}T00:00:00+05:30`).getTime();
    return new Date(base + ((h * 60 + m) * 60 * 1000)).toISOString();
  };

  return [
    {
      id: "a1",
      time: INCIDENT_TIMES.firstAnomaly,
      isoTime: isoAt(INCIDENT_TIMES.firstAnomaly),
      actor: "Reconciliation Engine",
      action: "Incident created",
      detail: "Expected vs. actual settlement mismatch detected on payment pay_A0dQ3VfBHixXy4 — INC-20260903-01 opened.",
    },
    {
      id: "a2",
      time: INCIDENT_TIMES.cumulative23,
      isoTime: isoAt(INCIDENT_TIMES.cumulative23),
      actor: "Anomaly Detection",
      action: "Records discovered",
      detail: "23 additional payments with matching duplicate-adjustment signature discovered across 3 settlement batches.",
    },
    {
      id: "a3",
      time: INCIDENT_TIMES.cumulative67,
      isoTime: isoAt(INCIDENT_TIMES.cumulative67),
      actor: "Relationship Engine",
      action: "Pattern detected",
      detail: `Duplicate refund-reference pattern confirmed across ${CONFIRMED_TRANSACTIONS} transactions in ${AFFECTED_BATCHES} settlement batches, ${AFFECTED_MERCHANTS} merchants.`,
    },
    {
      id: "a4",
      time: INCIDENT_TIMES.confirmedVariance,
      isoTime: isoAt(INCIDENT_TIMES.confirmedVariance),
      actor: "Investigation Engine",
      action: "Financial blast radius calculated",
      detail: `${AFFECTED_TRANSACTIONS} transactions, ${AFFECTED_BATCHES} settlement batches, ${AFFECTED_MERCHANTS} merchants — confirmed ${formatCompactINR(CONFIRMED_DISCREPANCY)}, potential exposure ${formatCompactINR(POTENTIAL_EXPOSURE)}.`,
    },
    {
      id: "a5",
      time: INCIDENT_TIMES.confirmedVariance,
      isoTime: isoAt(INCIDENT_TIMES.confirmedVariance),
      actor: "AI Investigator",
      action: "Root cause determined",
      detail: "Duplicate refund adjustment identified as likely cause, confidence 96%, based on 6 corroborating evidence facts.",
    },
    {
      id: "a6",
      time: INCIDENT_TIMES.confirmedVariance,
      isoTime: isoAt(INCIDENT_TIMES.confirmedVariance),
      actor: "AI Investigator",
      action: "Recommendation generated",
      detail: `Reverse duplicate adjustments on ${CONFIRMED_TRANSACTIONS} high-confidence transactions automatically; route ${REVIEW_TRANSACTIONS} transactions in the still-processing batch to human review.`,
    },
    {
      id: "a7",
      time: INCIDENT_TIMES.confirmedVariance,
      isoTime: isoAt(INCIDENT_TIMES.confirmedVariance),
      actor: "System",
      action: "Human approval requested",
      detail: "Recovery simulation prepared. No corrective action will be executed without explicit human sign-off.",
    },
  ];
}
