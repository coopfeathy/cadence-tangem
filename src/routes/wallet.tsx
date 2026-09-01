import { createFileRoute } from "@tanstack/react-router";
import { WalletHub } from "@/components/wallet-hub";

export const Route = createFileRoute("/wallet")({ component: WalletRoute });

function WalletRoute() {
  return <WalletHub />;
}
