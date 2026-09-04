import { getDataset } from "./generator";
import { getEvidence } from "./evidence";
import {
  AFFECTED_BATCHES,
  AFFECTED_MERCHANTS,
  AFFECTED_TRANSACTIONS,
  CONFIRMED_DISCREPANCY,
  CONFIRMED_TRANSACTIONS,
  INCIDENT_TIMES,
  POTENTIAL_EXPOSURE,
  REVIEW_EXPOSURE,
  REVIEW_TRANSACTIONS,
} from "./constants";

export interface IncidentSummary {
  id: string;
  title: string;
  status: "investigating" | "confirmed";
  severity: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  confirmedDiscrepancy: number;
  potentialExposure: number;
  reviewExposure: number;
  affectedTransactions: number;
  confirmedTransactionCount: number;
  reviewTransactionCount: number;
  affectedBatches: number;
  affectedMerchants: number;
  rootCause: string;
  rootCauseShort: string;
  evidenceCount: number;
  firstOccurrenceAt: string;
  confirmedAt: string;
  incidentDate: string;
}

function isoAt(dateISO: string, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const base = new Date(`${dateISO}T00:00:00+05:30`).getTime();
  return new Date(base + ((h * 60 + m) * 60 * 1000)).toISOString();
}

export function getIncidentSummary(): IncidentSummary {
  const ds = getDataset();
  return {
    id: "INC-20260903-01",
    title: "Duplicate refund adjustment across settlement batches",
    status: "confirmed",
    severity: "HIGH",
    confidence: 96,
    confirmedDiscrepancy: CONFIRMED_DISCREPANCY,
    potentialExposure: POTENTIAL_EXPOSURE,
    reviewExposure: REVIEW_EXPOSURE,
    affectedTransactions: AFFECTED_TRANSACTIONS,
    confirmedTransactionCount: CONFIRMED_TRANSACTIONS,
    reviewTransactionCount: REVIEW_TRANSACTIONS,
    affectedBatches: AFFECTED_BATCHES,
    affectedMerchants: AFFECTED_MERCHANTS,
    rootCause:
      "A duplicate refund adjustment was posted alongside the original refund on each affected payment, debiting the settlement amount twice for the same refund event.",
    rootCauseShort: "Duplicate refund adjustment",
    evidenceCount: getEvidence().length,
    firstOccurrenceAt: isoAt(ds.incidentDate, INCIDENT_TIMES.firstAnomaly),
    confirmedAt: isoAt(ds.incidentDate, INCIDENT_TIMES.confirmedVariance),
    incidentDate: ds.incidentDate,
  };
}
