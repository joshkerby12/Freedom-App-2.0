import type { ExpiryStatus } from "@/lib/fleet/types";

type ExpiryBadgeProps = {
  status: ExpiryStatus;
  className?: string;
  compact?: boolean;
};

const statusCopy: Record<ExpiryStatus, string> = {
  ok: "Current",
  warning: "Expiring Soon",
  critical: "Expires Soon",
  expired: "EXPIRED",
};

const statusClassName: Record<ExpiryStatus, string> = {
  ok: "border-[var(--divider)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]",
  warning: "border-[#f2c14e] bg-[#fff6dd] text-[#8a6708]",
  critical: "border-[#e76f51] bg-[#ffe9e4] text-[#b43e1f]",
  expired: "border-[var(--error)] bg-[#ffe4e4] text-[var(--error)]",
};

export function ExpiryBadge({ status, className, compact = false }: ExpiryBadgeProps) {
  const sizeClassName = compact ? "px-2" : "px-2.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClassName} py-1 text-xs font-semibold ${statusClassName[status]} ${className ?? ""}`}
    >
      {statusCopy[status]}
    </span>
  );
}
