"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteRoomButtonProps = {
  challengeId: string;
};

export default function DeleteRoomButton({
  challengeId,
}: DeleteRoomButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "정말 이 Room을 삭제할까요?\n\n모든 멤버, 기록, 사진이 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/rooms/${challengeId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Room을 삭제하는 중 문제가 발생했습니다.",
        );
      }

      router.push("/my-room");
      router.refresh();
    } catch (error) {
      console.error("DELETE ROOM ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Room을 삭제하는 중 문제가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="font-mono text-xs uppercase tracking-widest text-red-500/70 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete Room"}
    </button>
  );
}