import { getDataset } from "./generator";
import { formatCompactINR } from "../format";
import { INCIDENT_TIMES } from "./constants";

export interface TimelineEvent {
  id: string;
  time: string;
  isoTime: string;
  title: string;
  description: string;
  cumulativeAffected: number;
  kind: "normal" | "detection" | "escalation" | "confirmation";
}

export function getTimeline(): TimelineEvent[] {
  const ds = getDataset();
  const isoAt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const base = new Date(`${ds.incidentDate}T00:00:00+05:30`).getTime();
    return new Date(base + ((h * 60 + m) * 60 * 1000)).toISOString();
  };

  return [
    {
      id: "t0",
      time: INCIDENT_TIMES.normal,
      isoTime: isoAt(INCIDENT_TIMES.normal),
      title: "Reconciliation nominal",
      description: "All settlement batches reconciling within tolerance. No anomalies detected.",
      cumulativeAffected: 0,
      kind: "normal",
    },
    {
      id: "t1",
      time: INCIDENT_TIMES.firstAnomaly,
      isoTime: isoAt(INCIDENT_TIMES.firstAnomaly),
      title: "First anomaly detected",
      description: "Duplicate refund adjustment observed on a single payment at Zenith Retail — settlement short by ₹2,000 against expected.",
      cumulativeAffected: 1,
      kind: "detection",
    },
    {
      id: "t2",
      time: INCIDENT_TIMES.cumulative5,
      isoTime: isoAt(INCIDENT_TIMES.cumulative5),
      title: "5 affected transactions",
      description: "Same duplicate-reference pattern recurs within the same settlement batch.",
      cumulativeAffected: 5,
      kind: "detection",
    },
    {
      id: "t3",
      time: INCIDENT_TIMES.cumulative23,
      isoTime: isoAt(INCIDENT_TIMES.cumulative23),
      title: "23 affected transactions",
      description: "Pattern spreads across additional settlement batches and a second merchant — scope escalated.",
      cumulativeAffected: 23,
      kind: "escalation",
    },
    {
      id: "t4",
      time: INCIDENT_TIMES.cumulative67,
      isoTime: isoAt(INCIDENT_TIMES.cumulative67),
      title: "67 affected transactions",
      description: "Pattern verified across 4 settlement batches and 3 merchants. 67 transactions reach high-confidence confirmation.",
      cumulativeAffected: 67,
      kind: "escalation",
    },
    {
      id: "t5",
      time: INCIDENT_TIMES.confirmedVariance,
      isoTime: isoAt(INCIDENT_TIMES.confirmedVariance),
      title: `${formatCompactINR(214000)} confirmed variance`,
      description:
        "Confirmed discrepancy calculated across 67 high-confidence transactions. 16 additional transactions (₹1.32L) held for human review, bringing potential exposure to ₹3.46L.",
      cumulativeAffected: 83,
      kind: "confirmation",
    },
  ];
}
