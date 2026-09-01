import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="min-h-dvh p-8" style={{ background: "#f1ece3", color: "#1c1916" }}>
      <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: 12, color: "#2f5e52", fontWeight: 600 }}>
        Care coordination
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "3rem", letterSpacing: "-0.03em", marginTop: 12 }}>Lumen</h1>
      <p style={{ maxWidth: "40ch", marginTop: 12, color: "#6f685e" }}>
        The care board is served by the Angular + Nest stack. Open the live app to manage
        medications, visits, and the family circle.
      </p>
    </main>
  );
}
