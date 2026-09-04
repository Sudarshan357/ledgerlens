import { OverviewHero } from "@/components/overview/OverviewHero";
import { getIncidentSummary } from "@/lib/data/incident";
import { getHealthMetrics } from "@/lib/data/health";

export default function OverviewPage() {
  const incident = getIncidentSummary();
  const health = getHealthMetrics();

  return <OverviewHero incident={incident} health={health} />;
}
