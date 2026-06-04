"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[--bg-base] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-[--border] bg-[--bg-surface] p-6">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
          required
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded bg-[--accent-blue] px-4 py-2 text-sm font-medium text-[--bg-base]"
        >
          {loading ? "..." : "login"}
        </button>
      </form>
    </section>
  );
}
