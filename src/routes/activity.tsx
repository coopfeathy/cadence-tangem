import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeed } from "@/components/activity-feed";

export const Route = createFileRoute("/activity")({ component: ActivityRoute });

function ActivityRoute() {
  return <ActivityFeed />;
}
