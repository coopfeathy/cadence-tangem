import { createFileRoute } from "@tanstack/react-router";
import { PlansPage } from "@/components/plans-page";

export const Route = createFileRoute("/plans")({ component: PlansRoute });

function PlansRoute() {
  return <PlansPage />;
}
