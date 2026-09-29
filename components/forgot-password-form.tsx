"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError(
        "비밀번호는 최소 6자 이상이어야 합니다.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setPassword("");
      setConfirmPassword("");

      setMessage("비밀번호가 변경되었습니다.");
    } catch (error) {
      console.error(
        "UPDATE PASSWORD ERROR:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "비밀번호를 변경할 수 없습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="password"
          className="font-mono text-[10px] uppercase tracking-widest text-[#29272D]/40"
        >
          New Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-[#29272D]/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#625080]"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="font-mono text-[10px] uppercase tracking-widest text-[#29272D]/40"
        >
          Confirm Password
        </label>

        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-[#29272D]/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#625080]"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          {message && (
            <p className="text-sm text-[#625080]">
              {message}
            </p>
          )}

          {error && (
            <p className="text-sm text-[#A33A3A]">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-[#625080] px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "UPDATING..." : "UPDATE PASSWORD"}
        </button>
      </div>
    </form>
  );
}