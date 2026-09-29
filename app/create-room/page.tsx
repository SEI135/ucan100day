"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function generateInviteCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () =>
    characters.charAt(
      Math.floor(Math.random() * characters.length),
    ),
  ).join("");
}

export default function CreateRoomPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateRoom(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("방 이름을 입력해주세요.");
      return;
    }

    if (!startDate || !endDate) {
      setError("시작일과 최종일을 모두 입력해주세요.");
      return;
    }

    if (endDate <= startDate) {
      setError("최종일은 시작일보다 뒤여야 합니다.");
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

      let challenge = null;
      let challengeError = null;

      // 초대 코드 중복은 DB의 unique index가 최종적으로 방지한다.
      // 충돌할 경우 새로운 코드를 생성해서 최대 5번 재시도한다.
      for (let attempt = 0; attempt < 5; attempt++) {
        const inviteCode = generateInviteCode();

        const result = await supabase
          .from("challenges")
          .insert({
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            invite_code: inviteCode,
            owner_id: user.id,
          })
          .select("id")
          .single();

        if (!result.error) {
          challenge = result.data;
          break;
        }

        challengeError = result.error;

        // 초대 코드 중복이 아닌 다른 오류라면
        // 불필요하게 다시 시도하지 않는다.
        if (result.error.code !== "23505") {
          break;
        }
      }

      if (challengeError || !challenge) {
        console.error("CREATE CHALLENGE ERROR:", {
          message: challengeError?.message,
          details: challengeError?.details,
          hint: challengeError?.hint,
          code: challengeError?.code,
        });

        setError(
          challengeError?.message ??
            "방을 만드는 중 문제가 발생했습니다.",
        );
        return;
      }

      const defaultNickname =
        user.email?.split("@")[0] || "Anonymous";

      const { error: memberError } = await supabase
        .from("members")
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          nickname: defaultNickname,
        });

      if (memberError) {
        console.error("CREATE MEMBER ERROR:", {
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
          code: memberError.code,
        });

        // 방 생성 후 멤버 생성이 실패하면 방을 정리한다.
        await supabase
          .from("challenges")
          .delete()
          .eq("id", challenge.id);

        setError(
          memberError.message ||
            "방 멤버를 생성하는 중 문제가 발생했습니다.",
        );
        return;
      }

      router.push(`/room/${challenge.id}`);
      router.refresh();
    } catch (error) {
      console.error("CREATE ROOM ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "방을 만드는 중 문제가 발생했습니다.",
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
            새로운 기록
          </h1>

          <p className="mt-4 text-sm text-[#29272D]/60">
            함께할 기록을 시작해보세요.
          </p>
        </header>

        <section className="relative">
          <div className="absolute -left-3 top-8 h-20 w-32 rounded-t-2xl bg-[#625080]" />

          <div className="relative rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">
            <form
              onSubmit={handleCreateRoom}
              className="space-y-8"
            >
              <div>
                <label
                  htmlFor="name"
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  Room Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  placeholder="예: 우리들의 100일"
                  className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="font-mono text-xs uppercase tracking-widest"
                  >
                    Start Date
                  </label>

                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="font-mono text-xs uppercase tracking-widest"
                  >
                    End Date
                  </label>

                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-[#29272D]/20 bg-white px-4 py-3 outline-none transition focus:border-[#625080]"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#E8B83F]/15 px-5 py-4">
                <p className="font-mono text-xs uppercase tracking-widest text-[#C99725]">
                  How it works
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#29272D]/70">
                  방을 만들면 초대 코드가 자동으로 생성됩니다.
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
                {loading ? "Creating..." : "Create Room"}
              </button>
            </form>
          </div>
        </section>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#29272D]/50">
            이미 친구가 만든 Room이 있나요?
          </p>

          <button
            type="button"
            onClick={() => router.push("/join-room")}
            className="mt-2 font-mono text-xs uppercase tracking-widest text-[#625080] hover:underline"
          >
            Join Room →
          </button>
        </div>
      </div>
    </main>
  );
}