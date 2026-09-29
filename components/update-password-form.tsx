"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("UPDATE PASSWORD ERROR:", error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("비밀번호가 변경되었습니다.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-[#29272D]/50">
          New Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호"
          className="w-full rounded-2xl border border-[#29272D]/15 bg-[#F1EEE7] px-5 py-4 text-sm outline-none transition focus:border-[#625080]"
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-[#29272D]/50">
          Confirm Password
        </label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호 확인"
          className="w-full rounded-2xl border border-[#29272D]/15 bg-[#F1EEE7] px-5 py-4 text-sm outline-none transition focus:border-[#625080]"
        />
      </div>

      {message && (
        <p className="text-sm text-[#625080]">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#625080] px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition hover:opacity-80 disabled:opacity-40"
      >
        {loading ? "SAVING..." : "CHANGE PASSWORD"}
      </button>
    </form>
  );
}