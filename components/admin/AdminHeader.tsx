import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function AdminHeader() {
  async function signOut() {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "0.5px solid var(--border-muted)",
        background: "var(--bg-base)",
        padding: "0.8rem 1.5rem",
      }}
    >
      <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-dim)" }}>
        admin
      </p>
      <form action={signOut}>
        <button
          type="submit"
          style={{
            fontSize: "11.5px",
            border: "0.5px solid var(--border)",
            color: "var(--text-muted)",
            background: "transparent",
            padding: "5px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          sign out
        </button>
      </form>
    </header>
  );
}
