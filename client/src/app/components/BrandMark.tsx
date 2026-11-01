import { Sprout } from "lucide-react";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label="BareMinimum home">
      <span className="brand-mark__symbol" aria-hidden="true">
        <Sprout size={18} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="brand-mark__wordmark">
          bare<span>minimum</span>
        </span>
      )}
    </div>
  );
}
