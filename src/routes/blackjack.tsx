import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blackjack")({
  beforeLoad: () => {
    throw redirect({ to: "/tables" });
  },
});
