import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getChallengeDay,
  getDayNumber,
} from "@/lib/date";
import { redirect } from "next/navigation";
import Stamp from "@/components/Stamp";
import LogoutButton from "@/components/logout-button";

type PageProps = {
  params: Promise<{
    id: string;
    day: string;
  }>;
};

export default async function ArchiveDayPage({
  params,
}: PageProps) {
  const { id, day } = await params;

  const supabase = await createClient();

  // --------------------------------
  // 로그인 확인
  // --------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // --------------------------------
  // D-day 확인
  // --------------------------------

  const dDay = Number(
    day.replace("D-", "")
  );

  if (
    !Number.isInteger(dDay) ||
    dDay < 1 ||
    dDay > 100
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1EEE7]">
        <p className="font-mono text-sm">
          Invalid archive day.
        </p>
      </main>
    );
  }

  // --------------------------------
  // Room 가져오기
  // --------------------------------

  const {
    data: challenge,
    error: challengeError,
  } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (challengeError || !challenge) {
    console.error(
      "ARCHIVE CHALLENGE ERROR:",
      challengeError
    );

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1EEE7]">
        <p className="font-mono text-sm">
          No challenge found.
        </p>
      </main>
    );
  }

  // --------------------------------
  // 현재 사용자가 이 Room의 멤버인지 확인
  // --------------------------------

  const { data: myMembership } =
    await supabase
      .from("members")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (!myMembership) {
    redirect("/");
  }

  // --------------------------------
  // Members
  // --------------------------------

  const { data: members } = await supabase
    .from("members")
    .select(
      "id, user_id, nickname, avatar_url"
    )
    .eq("challenge_id", challenge.id)
    .order("created_at", {
      ascending: true,
    });

  // --------------------------------
  // 오늘 날짜 / D-day
  // --------------------------------

  const dayNumber = getDayNumber(
    challenge.start_date
  );

  const {
    today,
    dDay: todayDday,
  } = getChallengeDay(
    challenge.start_date
  );

  // 오늘 기록은 Room 메인 화면으로
  if (dDay === todayDday) {
    redirect(`/room/${id}`);
  }

  // 아직 오지 않은 미래 날짜
  if (dDay < todayDday) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1EEE7]">
        <p className="font-mono text-sm">
          This archive is not available yet.
        </p>
      </main>
    );
  }

  /*
   * D-day → challenge day number
   *
   * 예:
   * D-98 → day 3
   * D-97 → day 4
   */

  const targetDayNumber =
    100 - dDay + 1;

  // --------------------------------
  // Submissions
  // --------------------------------

  const { data: submissions } =
    await supabase
      .from("submissions")
      .select(
        "id, member_id, day_number, image_path, caption"
      )
      .eq("challenge_id", challenge.id)
      .eq("day_number", targetDayNumber);

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

        {/* File */}

        <section className="relative">

          {/* Folder tab */}

          <div className="absolute -left-10 top-8 z-0 flex h-20 w-10 items-center justify-end rounded-tl-2xl bg-[#625080] pr-1">
            <span className="font-mono text-sm font-bold tracking-[0.2em] text-white">
              {dDay}
            </span>
          </div>

          <div className="relative z-10 rounded-3xl border border-[#29272D]/20 bg-[#FFFDF7] p-8 shadow-[8px_10px_0px_rgba(41,39,45,0.12)]">

            {/* File heading */}

            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#625080]">
                  Daily Records
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Everyone's File
                </h2>
              </div>

              <p className="font-mono text-xs uppercase tracking-widest">
                {completedCount} /{" "}
                {members?.length ?? 0}{" "}
                completed
              </p>
            </div>

            {/* Members */}

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
>
              {members?.map(
                (member, index) => {
                  const submission =
                    submissions?.find(
                      (item) =>
                        item.member_id ===
                        member.id
                    );

                  const rotations = [
                    -2,
                    2,
                    -1,
                    3,
                  ];

                  const rotation =
                    rotations[
                      index %
                        rotations.length
                    ];

                  return (
                    <Stamp
                      key={member.id}
                      challengeId={
                        challenge.id
                      }
                      memberId={
                        member.id
                      }
                      dayNumber={
                        targetDayNumber
                      }
                      name={
                        member.nickname
                      }
                      rotate={`${rotation}deg`}
                      imagePath={
                        submission?.image_path
                      }
                      caption={
                        submission?.caption
                      }
                      canEdit={
                        member.user_id ===
                        user.id
                      }
                    />
                  );
                }
              )}

            </div>

          </div>
        </section>

        {/* Archive Navigation */}

        <section className="mt-20">

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

            {Array.from(
              { length: 100 },
              (_, index) => {

                const archiveDay =
                  100 - index;

                const isCurrent =
                  archiveDay === dDay;

                const isFuture =
                  archiveDay < todayDday;

                // 아직 오지 않은 날짜

                if (isFuture) {
                  return (
                    <div
                      key={archiveDay}
                      className="flex aspect-square items-center justify-center rounded-xl border border-[#29272D]/10 bg-[#29272D]/5 text-xs font-mono text-[#29272D]/30"
                    >
                      —
                    </div>
                  );
                }

                // 현재 날짜 / 지난 날짜

                return (
                  <Link
                    key={archiveDay}
                    href={
                      archiveDay ===
                      todayDday
                        ? `/room/${id}`
                        : `/room/${id}/archive/D-${archiveDay}`
                    }
                    className={[
                      "flex aspect-square items-center justify-center rounded-xl border text-xs font-mono transition",

                      isCurrent
                        ? "border-[#625080] bg-[#625080] text-white"
                        : "border-[#29272D]/15 bg-[#FFFDF7] hover:-translate-y-1 hover:shadow-md",
                    ].join(" ")}
                  >
                    D-{archiveDay}
                  </Link>
                );
              }
            )}

          </div>

        </section>

        {/* Bottom navigation */}

        <nav className="mt-10 flex items-center justify-between">

          {dDay < 100 ? (
            <Link
              href={`/room/${id}/archive/D-${dDay + 1}`}
              className="font-mono text-xs uppercase tracking-widest hover:text-[#625080]"
            >
              ← D-{dDay + 1}
            </Link>
          ) : (
            <span />
          )}

          {dDay > 1 ? (
            <Link
              href={`/room/${id}/archive/D-${dDay - 1}`}
              className="font-mono text-xs uppercase tracking-widest hover:text-[#625080]"
            >
              D-{dDay - 1} →
            </Link>
          ) : (
            <span />
          )}

        </nav>

      </div>
    </main>
  );
}