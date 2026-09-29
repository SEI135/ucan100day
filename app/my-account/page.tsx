import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import UpdateNicknameForm from "@/components/update-nickname-form";
import UpdatePasswordForm from "@/components/update-password-form";
import DeleteAccountButton from "@/components/delete-account-button";

export default async function MyAccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 현재 사용자가 참여한 Room에서 사용하는 닉네임
  const { data: membership } = await supabase
    .from("members")
    .select("nickname")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#F1EEE7] px-6 py-10 text-[#29272D]">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <header className="mb-12 flex items-start justify-between gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#625080]">
              My Account
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Account Settings
            </h1>

            <p className="mt-4 text-sm text-[#29272D]/50">
              내 계정과 프로필을 관리합니다.
            </p>
          </div>

          <nav className="flex shrink-0 items-center gap-6 pt-1">
            <a
              href="/my-room"
              className="font-mono text-xs uppercase tracking-widest text-[#625080] transition-opacity hover:opacity-60"
            >
              MY ROOMS
            </a>
          </nav>
        </header>

        {/* PROFILE */}
        <section>
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
              Profile
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Profile
            </h2>
          </div>

          <div className="rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-7">
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#29272D]/40">
                Email
              </p>

              <p className="mt-2 text-sm">
                {user.email}
              </p>
            </div>

            <UpdateNicknameForm
              initialNickname={
                membership?.nickname ?? ""
              }
            />
          </div>
        </section>

        {/* PASSWORD */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#625080]">
              Security
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Password
            </h2>
          </div>

          <div className="rounded-3xl border border-[#29272D]/15 bg-[#FFFDF7] p-7">
            <UpdatePasswordForm />
          </div>
        </section>

        {/* DANGER ZONE */}
        <section className="mt-16 border-t border-[#29272D]/15 pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#A33A3A]">
            Danger Zone
          </p>

          <div className="mt-4 flex items-center justify-between gap-6 rounded-3xl border border-[#A33A3A]/25 bg-[#FFFDF7] p-7">
            <div>
              <h2 className="text-xl font-bold">
                Delete account
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#29272D]/55">
                계정을 삭제하면 내가 올린 기록과 사진이 삭제됩니다. 
                <br></br>방장인 Room이 있다면 먼저 Room을 삭제해야 합니다.
              </p>
            </div>

            <DeleteAccountButton />
          </div>
        </section>

      </div>
    </main>
  );
}