export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="4" cy="18" r="2.4" fill="var(--ink-300)" />
      <circle cx="12" cy="9" r="2.4" fill="var(--ink-500)" />
      <circle cx="20" cy="15" r="2.6" fill="var(--brand-red)" />
      <path d="M6.1 16.8L10 10.6M14 9.9L18.1 13.6" stroke="var(--ink-300)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[15px] font-semibold tracking-tight text-ink-900 ${className}`}>
      Ledger<span className="text-brand-red">Lens</span>
    </span>
  );
}
