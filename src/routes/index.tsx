import { createFileRoute, redirect } from "@tanstack/react-router";

// Temporary. Task 11 replaces this with the real home page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/editor" });
  },
});
