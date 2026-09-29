"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("SIGNUP ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    // 이메일 인증이 필요한 경우
    if (!data.session) {
      setRegistered(true);
      setLoading(false);
      return;
    }

    // 이메일 인증이 필요 없는 경우
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
            Together Archive
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            회원가입
          </h1>

          <p className="mt-4 text-sm text-[#29272D]/60">
            우리의 100일 기록에 함께하세요.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -left-3 top-6 h-16 w-28 rounded-t-2xl bg-[#625080]" />
          
          <div className="relative rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">
            {registered ? (
              <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8B83F]/20">
              <span className="text-2xl">✉</span>
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                인증 메일을 확인해주세요
              </h2>

              <Link
                href="/login"
                className="mt-8 inline-block rounded-xl bg-[#625080] px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#403653]"
              >
              Go to Login
            </Link>
          </div>
        ) : (
            <form onSubmit={handleSignup} className="space-y-6">
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
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  placeholder="8자 이상"
                />
              </div>

              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Confirm Password
                </label>

                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(event.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  placeholder="비밀번호 다시 입력"
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
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
)}
            <div className="mt-8 border-t border-[#29272D]/10 pt-6 text-center">
              <p className="text-sm text-[#29272D]/60">
                이미 계정이 있나요?
              </p>

              <Link
                href="/login"
                className="mt-2 inline-block font-mono text-xs uppercase tracking-widest text-[#625080] hover:text-[#403653]"
              >
                Log in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}