import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getChallengeDay, getDayNumber } from "@/lib/date";
import Stamp from "@/components/Stamp";
import LogoutButton from "@/components/logout-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. 해당 room 가져오기
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select(
      "id, name, start_date, end_date, invite_code, owner_id"
    )
    .eq("id", id)
    .single();

  if (challengeError || !challenge) {
    notFound();
  }

  // 3. 현재 사용자가 이 room의 멤버인지 확인
  const { data: myMembership, error: membershipError } =
    await supabase
      .from("members")
      .select("id, user_id, nickname")
      .eq("challenge_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (membershipError) {
    console.error("MEMBERSHIP ERROR:", membershipError);
  }

  if (!myMembership) {
    redirect("/");
  }

  // 4. room의 전체 멤버 가져오기
  const { data: members } = await supabase
    .from("members")
    .select("id, user_id, nickname, avatar_url")
    .eq("challenge_id", id)
    .order("created_at", { ascending: true });

  // 5. 현재 날짜 기준 D-day 계산
  const { today, dDay } = getChallengeDay(
    challenge.start_date
  );

  const dayNumber = getDayNumber(challenge.start_date);

  // 6. 오늘의 제출물 가져오기
  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, member_id, day_number, image_path, caption"
    )
    .eq("challenge_id", id)
    .eq("day_number", dayNumber);

  const completedCount =
    submissions?.length ?? 0;
    
  return (
    <main className="min-h-screen bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
<header className="mb-16 flex items-start justify-between gap-8">
  {/* LEFT */}
  <div className="min-w-0">
    <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
      Together Archive
    </p>

    <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
      {challenge.name}
    </h1>

    <p className="mt-4 text-sm text-[#29272D]/50">
      {challenge.start_date} — {challenge.end_date}
    </p>
  </div>

  {/* RIGHT */}
  <nav className="flex shrink-0 items-center gap-6 pt-1">
    <p className="hidden font-mono text-xs text-[#29272D]/50 sm:block">
      {today}
    </p>

    <Link
      href="/my-room"
      className="font-mono text-xs uppercase tracking-widest text-[#625080] transition-opacity hover:opacity-60"
    >
      MY ROOMS
    </Link>

    <Link
      href={`/room/${challenge.id}/settings`}
      className="font-mono text-xs uppercase tracking-widest text-[#625080] transition-opacity hover:opacity-60"
    >
      SETTINGS
    </Link>

    <LogoutButton />
  </nav>
</header>

        {/* TODAY'S FILE */}
        <section className="relative">

          {/* Folder tab */}
          <div className="absolute -left-3 top-8 h-20 w-32 rounded-t-2xl bg-[#625080]" />

          <div className="relative rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">

            {/* FILE HEADER */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#625080]">
                  Today's File
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  D-{dDay}
                </h2>
              </div>

              <div className="text-right">
                <p className="font-mono text-xs uppercase tracking-widest">
                {completedCount} /{" "}
                {members?.length ?? 0}{" "}
                completed
              </p>
              </div>
            </div>

            {/* STAMPS */}
<div
  className={[
    "grid gap-8",
    members && members.length === 1
      ? "grid-cols-1"
      : "",
    members && members.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "",
    members && members.length === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "",
    members && members.length === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "",
    members && members.length >= 5
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
      : "",
  ].join(" ")}
>              {members?.map((member, index) => {
                const rotations = [-2, 2, -1, 3];

                const submission = submissions?.find(
                  (item) =>
                    item.member_id === member.id
                );

                return (
                  <Stamp
                    key={member.id}
                    challengeId={challenge.id}
                    memberId={member.id}
                    dayNumber={dayNumber}
                    name={member.nickname}
                    rotate={`${rotations[index % rotations.length]}deg`}
                    imagePath={submission?.image_path}
                    caption={submission?.caption}
                    canEdit={member.user_id === user.id}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* ARCHIVE */}
        <section className="mt-24">

          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#625080]">
                Archive
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Our 100 Days
              </h2>
            </div>

            <span className="font-mono text-xs">
              {dayNumber} / 100
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {Array.from({ length: 100 }, (_, index) => {
              const day = 100 - index;

              const isToday = day === dDay;
              const isFuture = day < dDay;

              return (
                <Link
                  key={day}
                  href={
                    isFuture
                      ? "#"
                      : `/room/${id}/archive/D-${day}`
                  }
                  aria-disabled={isFuture}
                  className={[
                    "flex aspect-square items-center justify-center rounded-xl border text-xs font-mono transition",
                    isToday
                      ? "border-[#625080] bg-[#625080] text-white"
                      : isFuture
                        ? "pointer-events-none border-[#29272D]/10 bg-[#29272D]/5 text-[#29272D]/30"
                        : "border-[#29272D]/15 bg-[#FFFDF7] hover:-translate-y-1 hover:shadow-md",
                  ].join(" ")}
                >
                  {isFuture ? "—" : `D-${day}`}
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}