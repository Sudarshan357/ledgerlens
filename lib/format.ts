// Currency + numeric formatting helpers tuned for Indian fintech conventions.

/** Format an integer rupee amount with Indian digit grouping, e.g. 1234567 -> "12,34,567" */
export function formatINRDigits(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const n = Math.abs(rounded).toString();
  if (n.length <= 3) return sign + n;
  const last3 = n.slice(-3);
  const rest = n.slice(0, -3);
  const groups = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}${groups},${last3}`;
}

/** Full rupee format with symbol, e.g. "₹7,764" */
export function formatINR(amount: number): string {
  return `₹${formatINRDigits(amount)}`;
}

/** Compact lakh/crore format, e.g. 214000 -> "₹2.14L", 34600000 -> "₹3.46Cr" */
export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}₹${formatINRDigits(abs)}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
