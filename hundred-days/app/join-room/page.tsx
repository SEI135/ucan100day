"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinRoomPage() {
  const router = useRouter();
  const supabase = createClient();

  const [inviteCode, setInviteCode] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");

  const code = inviteCode.trim().toUpperCase();

  if (!code) {
    setError("초대 코드를 입력해주세요.");
    return;
  }

  if (code.length !== 6) {
    setError("초대 코드는 6자리입니다.");
    return;
  }

  setLoading(true);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("로그인이 필요합니다.");
      return;
    }

    const defaultNickname =
      nickname.trim() ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const { data: challengeId, error: joinError } =
      await supabase.rpc("join_challenge", {
        p_invite_code: code,
        p_nickname: defaultNickname,
      });

    if (joinError) {
      console.error("JOIN ROOM ERROR:", {
         message: joinError.message,
    details: joinError.details,
    hint: joinError.hint,
    code: joinError.code,
      });

      
      if (joinError.message.includes("Invalid invite code")) {
        setError("존재하지 않는 초대 코드입니다.");
      } else if (
        joinError.message.includes("Nickname is too long")
      ) {
        setError("닉네임은 30자 이하로 입력해주세요.");
      } else if (
        joinError.message.includes("Nickname is required")
      ) {
        setError("닉네임을 입력해주세요.");
      } else {
        setError("방에 참가하는 중 문제가 발생했습니다.");
      }

      return;
    }

    if (!challengeId) {
      setError("방을 찾을 수 없습니다.");
      return;
    }

    router.push(`/room/${challengeId}`);
    router.refresh();
  } catch (error) {
    console.error("JOIN ROOM ERROR:", error);

    setError(
      error instanceof Error
        ? error.message
        : "방에 참가하는 중 문제가 발생했습니다.",
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
            Together Archive
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            기록에 참가
          </h1>

          <p className="mt-4 text-sm text-[#29272D]/60">
            친구에게 받은 초대 코드로 함께할 기록에 참가해보세요.
          </p>
        </header>

        <section className="relative">
          <div className="absolute -left-3 top-8 h-20 w-32 rounded-t-2xl bg-[#625080]" />

          <div className="relative rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">
            <form onSubmit={handleJoinRoom} className="space-y-8">
              <div>
                <label
                  htmlFor="inviteCode"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Invite Code
                </label>

                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(event) =>
                    setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),)
                  }
                  required
                  maxLength={6}
                  placeholder="예: ABC123"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 font-mono text-lg uppercase tracking-widest outline-none transition focus:border-[#625080]"
                />
              </div>

              <div>
                <label
                  htmlFor="nickname"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Nickname
                </label>

                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(event) =>
                    setNickname(event.target.value)
                  }
                  maxLength={30}
                  placeholder="예: 철수"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                />
              </div>

              <div className="rounded-2xl bg-[#E8B83F]/15 px-5 py-4">
                <p className="font-mono text-xs uppercase tracking-widest text-[#C99725]">
                  How it works
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#29272D]/70">
                  초대 코드를 입력하면 친구의 Room에 바로 참가할 수 있습니다.
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#625080] px-4 py-4 font-mono text-sm uppercase tracking-widest text-white transition hover:bg-[#403653] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Room"}
              </button>
            </form>
          </div>
        </section>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#29272D]/50">
            직접 새로운 기록을 시작하고 싶나요?
          </p>

          <button
            type="button"
            onClick={() => router.push("/create-room")}
            className="mt-2 font-mono text-xs uppercase tracking-widest text-[#625080] hover:underline"
          >
            Create Room →
          </button>
        </div>
      </div>
    </main>
  );
}