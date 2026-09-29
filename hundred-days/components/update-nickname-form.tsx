"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialNickname: string;
};

export default function UpdateNicknameForm({
  initialNickname,
}: Props) {
  const supabase = createClient();

  const [nickname, setNickname] = useState(initialNickname);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedNickname = nickname.trim();

    setMessage("");

    if (!trimmedNickname) {
      setMessage("닉네임을 입력해주세요.");
      return;
    }

    if (trimmedNickname.length > 30) {
      setMessage("닉네임은 30자 이하로 입력해주세요.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("members")
      .update({
        nickname: trimmedNickname,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("UPDATE NICKNAME ERROR:", error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setNickname(trimmedNickname);
    setMessage("닉네임이 변경되었습니다.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-[#29272D]/50">
          Nickname
        </label>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={30}
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
        {loading ? "SAVING..." : "SAVE NICKNAME"}
      </button>
    </form>
  );
}