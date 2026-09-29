"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  challengeId: string;
};

export default function LeaveRoomButton({
  challengeId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    const confirmed = window.confirm(
      "정말 이 Room에서 나갈까요?\n\n이 Room에서 내가 올린 사진과 기록도 삭제됩니다.",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/rooms/${challengeId}/leave`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Room에서 나갈 수 없습니다.",
        );
      }

      router.push("/my-room");
      router.refresh();
    } catch (error) {
      console.error("LEAVE ROOM ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Room에서 나가는 중 문제가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLeave}
      disabled={loading}
      className="rounded-full border border-[#29272D]/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#29272D]/60 transition-colors hover:border-[#29272D] hover:text-[#29272D] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "LEAVING..." : "LEAVE ROOM"}
    </button>
  );
}