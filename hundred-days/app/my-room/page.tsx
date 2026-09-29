import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function MyRoomPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error } = await supabase
    .from("members")
    .select(`
      id,
      nickname,
      challenge_id,
      challenges (
        id,
        name,
        start_date,
        end_date,
        owner_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("MY ROOMS ERROR:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  return (
    <main className="min-h-screen bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-14">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
                Together Archive
              </p>

              <h1 className="mt-3 text-5xl font-bold tracking-tight">
                My Rooms
              </h1>

              <p className="mt-4 text-sm text-[#29272D]/60">
                내가 참여하고 있는 기록들을 모아봤어요.
              </p>
            </div>

            <nav className="flex shrink-0 items-center gap-6 pt-1">
              <Link
                href="/my-account"
                className="font-mono text-xs uppercase tracking-widest text-[#625080] transition-opacity hover:opacity-60"
              >
                MY ACCOUNT
              </Link>

              <LogoutButton />
            </nav>
          </div>
        </header>

        {/* My Archive */}
        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Existing Rooms */}
            {memberships?.map((membership) => {
              const challenge = Array.isArray(membership.challenges)
                ? membership.challenges[0]
                : membership.challenges;

              if (!challenge) {
                return null;
              }

              const isOwner = challenge.owner_id === user.id;

              return (
                <Link
                  key={membership.id}
                  href={`/room/${challenge.id}`}
                  className="group relative block"
                >
                  {/* Folder tab */}
                  <div className="absolute -left-2 top-5 h-10 w-20 rounded-t-xl bg-[#625080] transition-transform group-hover:-translate-y-1" />

                  {/* Folder */}
                  <div className="relative min-h-56 rounded-2xl border border-[#29272D]/20 bg-[#FFFDF7] p-6 shadow-[6px_7px_0px_rgba(41,39,45,0.1)] transition-transform group-hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#625080]">
                        {isOwner ? "Owner" : "Member"}
                      </span>

                      <span className="font-mono text-[10px] text-[#29272D]/40">
                        ROOM
                      </span>
                    </div>

                    <h2 className="mt-8 text-2xl font-bold tracking-tight">
                      {challenge.name}
                    </h2>

                    <div className="mt-6 border-t border-[#29272D]/10 pt-4">
                      <p className="font-mono text-xs text-[#29272D]/50">
                        {challenge.start_date}
                      </p>

                      <p className="mt-1 font-mono text-xs text-[#29272D]/50">
                        → {challenge.end_date}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-[#29272D]/50">
                        {membership.nickname}
                      </span>

                      <span className="font-mono text-xs text-[#625080]">
                        OPEN →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Create New Room */}
            <Link
              href="/create-room"
              className="group relative block"
            >
              {/* Folder tab */}
              <div className="absolute -left-2 top-5 h-10 w-20 rounded-t-xl border border-dashed border-[#625080]/50 bg-[#E8B83F] transition-transform group-hover:-translate-y-1" />

              {/* Folder */}
              <div className="relative flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[#625080]/50 bg-[#FFFDF7] p-6 shadow-[6px_7px_0px_rgba(41,39,45,0.06)] transition-all group-hover:-translate-y-1 group-hover:bg-[#F8F2E4]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#625080]/30 bg-[#F1EEE7]">
                  <span className="text-3xl font-light text-[#625080]">
                    +
                  </span>
                </div>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#625080]">
                  New Archive
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Room 만들기
                </h2>

                <p className="mt-2 text-center text-xs text-[#29272D]/50">
                  새로운 기록을 시작해보세요.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Empty state */}
        {(!memberships || memberships.length === 0) && (
          <div className="mt-8 rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-8 text-center">
            <p className="text-sm text-[#29272D]/55">
              아직 참여한 Room이 없어요.
            </p>

            <p className="mt-2 text-sm text-[#29272D]/45">
              위의 + 폴더에서 새로운 기록을 시작하거나,
              초대 코드로 친구의 Room에 참가해보세요.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}