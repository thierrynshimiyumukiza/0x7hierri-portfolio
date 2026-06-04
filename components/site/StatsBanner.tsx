import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function StatsBanner() {
  const supabase = createClient();
  const { data: statsData, error } = await supabase
    .from("statistics")
    .select("id,number,label")
    .eq("visible", true)
    .order("display_order", { ascending: true });
  const data = (statsData as Pick<Tables<"statistics">, "id" | "number" | "label">[] | null) ?? [];

  if (error || !data?.length) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        maxWidth: "760px",
        margin: "0 auto",
        padding: "0 2rem 3rem",
        gap: 0,
      }}
    >
      {data.map((stat, i) => (
        <div
          key={stat.id}
          style={{
            flex: 1,
            paddingRight: i < data.length - 1 ? "1.5rem" : 0,
            borderRight: i < data.length - 1 ? "0.5px solid var(--border-muted)" : "none",
            marginRight: i < data.length - 1 ? "1.5rem" : 0,
            paddingTop: "2rem",
            borderTop: "0.5px solid var(--border-muted)",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {stat.number}
          </div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-dim)",
              marginTop: "3px",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
