"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="admin-shell login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="admin-nav-mark">0x</span>
          <div>
            <p className="login-title">Control room</p>
            <p className="admin-hint">Sign in to manage the site.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <label className="admin-field">
            <span className="admin-label">Email</span>
            <div className="login-input-wrap">
              <Mail size={14} aria-hidden="true" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="admin-input"
                required
              />
            </div>
          </label>

          <label className="admin-field">
            <span className="admin-label">Password</span>
            <div className="login-input-wrap">
              <Lock size={14} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="admin-input"
                required
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="login-error" role="alert">
              <TriangleAlert size={13} aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="admin-button admin-button-primary login-submit">
            {loading ? <Loader2 size={14} className="editor-spin" aria-hidden="true" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link href="/" className="login-back">
          <ArrowLeft size={12} aria-hidden="true" />
          Back to the site
        </Link>
      </div>
    </main>
  );
}
