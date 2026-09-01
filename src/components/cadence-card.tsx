import { Nfc } from "lucide-react";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/validate";

export function CadenceCard({
  address,
  networkLabel,
  label = "Tangem",
  className,
}: {
  address?: string;
  networkLabel?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "metal-card aspect-[1.586] w-full max-w-md rounded-2xl p-6 text-fg",
        className,
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.22em] text-muted uppercase">
              Self-custody
            </p>
            <p className="font-display mt-1 text-2xl font-medium italic">
              {label}
            </p>
          </div>
          <div className="nfc-rings flex items-center justify-center">
            <Nfc className="size-4 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              {networkLabel ?? "Awaiting address"}
            </p>
            <p className="mt-1 truncate font-mono text-sm tracking-wide">
              {address ? shortenAddress(address, 8, 6) : "···· ···· ····"}
            </p>
          </div>
          <p className="font-display text-sm tracking-wide text-muted italic">
            Cadence
          </p>
        </div>
      </div>
    </div>
  );
}
