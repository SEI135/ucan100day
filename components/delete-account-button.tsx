"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  async function handleDeleteAccount() {
    const firstConfirm = window.confirm(
      "정말 회원 탈퇴를 할까요?\n\n모든 계정 정보와 내가 올린 기록이 삭제됩니다.",
    );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      "이 작업은 되돌릴 수 없습니다.\n\n정말 탈퇴하시겠습니까?",
    );

    if (!secondConfirm) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/account/delete",
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "회원 탈퇴를 처리할 수 없습니다.",
        );
      }

      await supabase.auth.signOut();

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "DELETE ACCOUNT ERROR:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "회원 탈퇴 중 문제가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAccount}
      disabled={loading}
      className="rounded-full border border-[#A33A3A]/40 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#A33A3A] transition-colors hover:bg-[#A33A3A] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "DELETING..." : "DELETE ACCOUNT"}
    </button>
  );
}