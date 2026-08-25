import { createFileRoute, redirect } from "@tanstack/react-router";

// Kept so existing links and the Lovable OAuth callback still land somewhere real.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/join", search: { from: "unknown" } });
  },
});
