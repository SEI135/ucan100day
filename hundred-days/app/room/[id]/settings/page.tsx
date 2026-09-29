import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import DeleteRoomButton from "@/components/delete-room-button";
import CopyInviteCodeButton from "@/components/copy-invite-code-button";
import LeaveRoomButton from "@/components/leave-room-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomSettingsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Room 정보
  const { data: challenge, error: challengeError } =
    await supabase
      .from("challenges")
      .select(
        "id, name, start_date, end_date, invite_code, owner_id"
      )
      .eq("id", id)
      .single();

  if (challengeError || !challenge) {
    notFound();
  }

  // 현재 사용자가 Room 멤버인지 확인
  const { data: myMembership, error: membershipError } =
    await supabase
      .from("members")
      .select("id, user_id, nickname")
      .eq("challenge_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (membershipError) {
    console.error(
      "SETTINGS MEMBERSHIP ERROR:",
      membershipError
    );
  }

  if (!myMembership) {
    redirect("/my-room");
  }

  // 멤버 목록
  const { data: members, error: membersError } =
    await supabase
      .from("members")
      .select("id, user_id, nickname, avatar_url")
      .eq("challenge_id", id)
      .order("created_at", { ascending: true });

  if (membersError) {
    console.error(
      "SETTINGS MEMBERS ERROR:",
      membersError
    );
  }

  const isOwner = challenge.owner_id === user.id;

  return (
    <main className="min-h-screen bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <header className="mb-12 flex items-start justify-between gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
              Room Settings
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {challenge.name}
            </h1>

            <p className="mt-4 text-sm text-[#29272D]/50">
              {challenge.start_date} — {challenge.end_date}
            </p>
          </div>

          <Link
            href={`/room/${id}`}
            className="shrink-0 pt-1 font-mono text-xs uppercase tracking-widest text-[#625080] transition-opacity hover:opacity-60"
          >
            ← ROOM
          </Link>
        </header>

        {/* ROOM INFO */}
        <section className="rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-7 shadow-[6px_7px_0px_rgba(41,39,45,0.08)]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
              Room
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {challenge.name}
            </h2>

            <p className="mt-2 text-sm text-[#29272D]/50">
              {challenge.start_date} — {challenge.end_date}
            </p>
          </div>
        </section>

        {/* MEMBERS */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
              Members
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {members?.length ?? 0} people
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7]">
            {members?.map((member, index) => {
              const isMe = member.user_id === user.id;
              const isMemberOwner =
                member.user_id === challenge.owner_id;

              return (
                <div
                  key={member.id}
                  className={[
                    "flex items-center justify-between px-6 py-5",
                    index !== 0
                      ? "border-t border-[#29272D]/10"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8B83F] font-mono text-sm font-bold">
                      {member.nickname
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium">
                        {member.nickname}
                      </p>

                      {isMemberOwner && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[#625080]">
                          Owner
                        </p>
                      )}
                    </div>
                  </div>

                  {isMe && (
                    <span className="rounded-full bg-[#625080] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* INVITE CODE */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
              Invite
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Invite your friends
            </h2>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-7">
            <div>
              <p className="font-mono text-3xl font-bold tracking-[0.25em]">
                {challenge.invite_code}
              </p>

              <p className="mt-3 text-sm text-[#29272D]/50">
                친구에게 이 코드를 공유해서 Room에 초대할 수 있어요.
              </p>
            </div>

            <CopyInviteCodeButton
              code={challenge.invite_code ?? ""}
            />
          </div>
        </section>

        {!isOwner && (
  <section className="mt-16 border-t border-[#29272D]/15 pt-10">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
      Membership
    </p>

    <div className="mt-4 flex items-center justify-between gap-6 rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-7">
      <div>
        <h2 className="text-xl font-bold">
          Leave this room
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-[#29272D]/55">
          이 Room에서 나갑니다. 내가 올린 사진과 기록도 함께 삭제됩니다.
        </p>
      </div>

      <LeaveRoomButton challengeId={challenge.id} />
    </div>
  </section>
)}
        {/* DANGER ZONE */}
        {isOwner && (
          <section className="mt-16 border-t border-[#29272D]/15 pt-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#A33A3A]">
              Danger Zone
            </p>

            <div className="mt-4 flex items-center justify-between gap-6 rounded-3xl border border-[#A33A3A]/25 bg-[#FFFDF7] p-7">
              <div>
                <h2 className="text-xl font-bold">
                  Delete this room
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#29272D]/55">
                  이 Room을 삭제하면 모든 멤버와 기록이 함께 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>

              <DeleteRoomButton
                challengeId={challenge.id}
              />
            </div>
          </section>
        )}

      </div>
    </main>
  );
}