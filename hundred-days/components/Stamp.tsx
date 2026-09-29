"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StampProps = {
  challengeId: string;
  memberId: string;
  dayNumber: number;
  name: string;
  rotate: string;
  imagePath?: string | null;
  caption?: string | null;
  canEdit?: boolean;
};

export default function Stamp({
  challengeId,
  memberId,
  dayNumber,
  name,
  rotate = "0deg",
  imagePath,
  caption,
  canEdit = true,
}: StampProps) {
  const supabase = createClient();

  /* --------------------------------
     Original / Saved State
  -------------------------------- */

  const initialImageUrl = imagePath
    ? supabase.storage
        .from("challenge-photos")
        .getPublicUrl(imagePath).data.publicUrl
    : null;

  // 현재 화면에 표시할 사진
  const [imageUrl, setImageUrl] =
    useState<string | null>(initialImageUrl);

  // 현재 편집 중인 사진 경로
  const [currentImagePath, setCurrentImagePath] =
    useState<string | null>(imagePath ?? null);

  // 마지막으로 DB에 저장된 사진 경로
  const [originalImagePath, setOriginalImagePath] =
    useState<string | null>(imagePath ?? null);

  // 현재 편집 중인 글
  const [captionText, setCaptionText] =
    useState(caption ?? "");

  // 마지막으로 DB에 저장된 글
  const [originalCaption, setOriginalCaption] =
    useState(caption ?? "");

  /*
   * Edit 중 새롭게 Storage에 업로드한 파일
   *
   * 아직 DB에는 저장되지 않은 파일이다.
   * Save / Cancel 때 처리한다.
   */
  const [pendingImagePath, setPendingImagePath] =
    useState<string | null>(null);

  /* --------------------------------
     UI State
  -------------------------------- */

  // 처음 기록이 없으면 바로 편집 상태
  const [editing, setEditing] = useState(
    canEdit && !imagePath && !caption
  );

  const [uploading, setUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* --------------------------------
     Storage Delete
  -------------------------------- */

  const handleStorageDelete = async (
    filePath: string | null
  ) => {
    if (!filePath) return;

    const { error } = await supabase.storage
      .from("challenge-photos")
      .remove([filePath]);

    if (error) {
      console.error(
        "STORAGE DELETE ERROR:",
        error
      );
    }
  };

  /* --------------------------------
     Photo Upload
  -------------------------------- */

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const extension =
        file.name.split(".").pop() || "jpg";

      /*
       * 기존 pending 파일이 있다면
       * 아직 DB에 저장되지 않은 임시 파일이므로
       * 새 사진으로 교체하기 전에 삭제한다.
       */
      if (pendingImagePath) {
        await handleStorageDelete(
          pendingImagePath
        );
      }

      const filePath =
        `${challengeId}/${memberId}/day-${dayNumber}-${Date.now()}.${extension}`;

      /* 새 사진 업로드 */
      const { error: uploadError } =
        await supabase.storage
          .from("challenge-photos")
          .upload(filePath, file, {
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      /* 새 사진 URL */
      const { data } =
        supabase.storage
          .from("challenge-photos")
          .getPublicUrl(filePath);

      /*
       * 화면에는 새 사진 표시
       * 하지만 DB에는 아직 저장하지 않는다.
       */
      setImageUrl(data.publicUrl);
      setCurrentImagePath(filePath);

      /*
       * Save 전까지는 새 사진을
       * pending 상태로 관리한다.
       */
      setPendingImagePath(filePath);

    } catch (error) {
      console.error(
        "PHOTO UPLOAD ERROR:",
        error
      );

      setError(
        "사진 업로드에 실패했습니다."
      );
    } finally {
      setUploading(false);

      // 같은 파일을 다시 선택할 수 있도록 초기화
      event.target.value = "";
    }
  };

  /* --------------------------------
     Photo Delete
  -------------------------------- */

  const handlePhotoDelete = () => {
    /*
     * Storage에서 즉시 삭제하지 않는다.
     *
     * Save를 눌렀을 때 실제 삭제한다.
     * 그래야 Cancel이 가능하다.
     */
    setImageUrl(null);
    setCurrentImagePath(null);
  };

  /* --------------------------------
     Save
  -------------------------------- */

  const handleSave = async () => {
    if (uploading) return;

    setSaving(true);
    setError("");

    try {
      /*
       * 먼저 DB 저장
       *
       * 이 단계가 성공해야 Storage 정리를 진행한다.
       */
      const { error: submissionError } =
        await supabase
          .from("submissions")
          .upsert(
            {
              challenge_id: challengeId,
              member_id: memberId,
              day_number: dayNumber,
              image_path: currentImagePath,
              caption: captionText || null,
            },
            {
              onConflict:
                "member_id,day_number",
            }
          );

      if (submissionError) {
        throw submissionError;
      }

      /*
       * DB 저장 성공
       * 이제 기존 Storage 파일을 정리한다.
       */

      /*
       * 기존 사진이 있고,
       * 새 사진으로 변경되었거나
       * 사진을 삭제했다면
       * 기존 사진을 삭제한다.
       */
      if (
        originalImagePath &&
        originalImagePath !== currentImagePath
      ) {
        await handleStorageDelete(
          originalImagePath
        );
      }

      /*
       * 사진을 삭제한 경우
       *
       * pendingImagePath가 있다면
       * 새로 업로드했던 파일도 삭제한다.
       *
       * 예:
       * 기존 A
       * ↓
       * 새 B 업로드
       * ↓
       * X 클릭
       * ↓
       * Save
       *
       * DB = null
       * Storage에서 A, B 둘 다 삭제
       */
      if (
        !currentImagePath &&
        pendingImagePath
      ) {
        await handleStorageDelete(
          pendingImagePath
        );
      }

      /*
       * 현재 상태를 새로운 저장 상태로 확정
       */
      setOriginalImagePath(
        currentImagePath
      );

      setOriginalCaption(
        captionText
      );

      setPendingImagePath(null);

      /*
       * 일반 보기 모드
       */
      setEditing(false);

    } catch (error) {
      console.error(
        "SAVE ERROR:",
        error
      );

      setError(
        "기록 저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------
     Cancel
  -------------------------------- */

  const handleCancel = async () => {
    if (saving || uploading) return;

    setError("");

    /*
     * Edit 중 새로 업로드한 사진은
     * DB에 저장되지 않았으므로 삭제한다.
     */
    if (
      pendingImagePath &&
      pendingImagePath !== originalImagePath
    ) {
      await handleStorageDelete(
        pendingImagePath
      );
    }

    /*
     * 화면을 마지막 저장 상태로 복구
     */
    setCurrentImagePath(
      originalImagePath
    );

    setCaptionText(
      originalCaption
    );

    if (originalImagePath) {
      const { data } =
        supabase.storage
          .from("challenge-photos")
          .getPublicUrl(
            originalImagePath
          );

      setImageUrl(data.publicUrl);
    } else {
      setImageUrl(null);
    }

    setPendingImagePath(null);

    /*
     * 일반 보기 모드로 돌아간다.
     *
     * 단, 처음부터 기록이 없었던 경우에는
     * 다시 편집 상태를 유지한다.
     */
    if (
      !originalImagePath &&
      !originalCaption
    ) {
      setEditing(true);
    } else {
      setEditing(false);
    }
  };

  /* --------------------------------
     Render
  -------------------------------- */

  return (
    <div
      style={{
        transform: `rotate(${rotate})`,
      }}
      className="stamp group relative bg-[#F1EEE7] p-3 transition duration-300 hover:-translate-y-2"
    >
      <div className="stamp-holes pointer-events-none absolute inset-0 z-10" />

      {/* --------------------------------
          Photo
      -------------------------------- */}

      <div className="relative z-20 aspect-[4/5] overflow-hidden">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${name} challenge photo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <label
            className={[
              "flex h-full items-center justify-center bg-[#625080]/10",
              canEdit && editing
                ? "cursor-pointer"
                : "cursor-default",
            ].join(" ")}
          >
            <span className="font-mono text-xs uppercase tracking-widest text-[#625080]">
              {uploading
                ? "UPLOADING..."
                : "PHOTO"}
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={
                uploading || !editing || !canEdit
              }
              className="hidden"
            />
          </label>
        )}

        {/* --------------------------------
            Delete Photo
        -------------------------------- */}

        {canEdit && editing && imageUrl && (
          <button
            type="button"
            onClick={handlePhotoDelete}
            disabled={uploading || saving}
            className="absolute right-1 top-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#29272D]/80 text-sm text-white transition hover:bg-[#29272D] disabled:opacity-40"
            aria-label="사진 삭제"
          >
            ×
          </button>
        )}

        {/* --------------------------------
            Change Photo
        -------------------------------- */}

        {canEdit && editing && imageUrl && (
          <label className="absolute inset-0 z-20 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}

      </div>

      {/* --------------------------------
          Info
      -------------------------------- */}

      <div className="relative z-20 mt-3">

        {/* Yellow Status Dot */}

        <div className="flex items-center justify-end">
          <span
            className={[
              "h-2 w-2 rounded-full",
              imageUrl || captionText
                ? "bg-[#E8B83F]"
                : "border border-[#E8B83F]",
            ].join(" ")}
          />
        </div>

        {/* Name */}

        <p className="mt-1 text-sm font-semibold">
          {name}
        </p>

        {/* --------------------------------
            Editing Mode
        -------------------------------- */}

        {editing ? (
          <div className="mt-2">

            <textarea
              value={captionText}
              onChange={(event) =>
                setCaptionText(
                  event.target.value
                )
              }
              placeholder="오늘의 기록..."
              rows={3}
              disabled={saving}
              className="w-full resize-none bg-transparent text-xs leading-relaxed outline-none placeholder:text-[#29272D]/30 disabled:opacity-50"
            />

            <div className="mt-1 flex items-center gap-3">

              {/* Save */}

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving || uploading
                }
                className="font-mono text-[10px] uppercase tracking-widest text-[#625080] hover:underline disabled:opacity-40"
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>

              {/* Cancel */}

              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  saving || uploading
                }
                className="font-mono text-[10px] uppercase tracking-widest text-[#29272D]/50 hover:text-[#29272D] hover:underline disabled:opacity-40"
              >
                Cancel
              </button>

            </div>

          </div>
        ) : (

          /* --------------------------------
             View Mode
          -------------------------------- */

          <div className="mt-2">

            {captionText && (
              <p className="text-xs leading-relaxed text-[#29272D]/70">
                {captionText}
              </p>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setEditing(true);
                }}
                className="mt-[3.25rem] font-mono text-[10px] uppercase tracking-widest text-[#625080] hover:underline"
              >
                Edit
              </button>
            )}

          </div>
        )}

      </div>

      {/* --------------------------------
          Error
      -------------------------------- */}

      {error && (
        <p className="relative z-20 mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}