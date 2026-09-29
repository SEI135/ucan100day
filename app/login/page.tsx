"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("이메일 또는 비밀번호를 확인해주세요.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1EEE7] px-6 text-[#29272D]">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
            Together Archive
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            로그인
          </h1>

          <p className="mt-4 text-sm text-[#29272D]/60">
            우리의 100일 기록을 이어가세요.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -left-3 top-6 h-16 w-28 rounded-t-2xl bg-[#625080]" />

          <div className="relative rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#625080] px-4 py-3 font-mono text-sm uppercase tracking-widest text-white transition hover:bg-[#403653] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#29272D]/10 pt-6 text-center">
              <p className="text-sm text-[#29272D]/60">
                아직 계정이 없나요?
              </p>
              <Link
                href="/signup"
                className="mt-2 inline-block font-mono text-xs uppercase tracking-widest text-[#625080] hover:text-[#403653]"
              >
              SIGN UP
            </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}