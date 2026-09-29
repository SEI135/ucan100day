"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PhotoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("사진을 먼저 선택해주세요.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const fileExtension = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExtension}`;

      const filePath = `test/${fileName}`;

      const { error } = await supabase.storage
        .from("challenge-photos")
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      setMessage("사진 업로드 성공!");
      console.log("Uploaded file:", filePath);
    } catch (error) {
      console.error(error);
      setMessage("사진 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setMessage("");
        }}
      />

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="rounded-full bg-[#625080] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {uploading ? "업로드 중..." : "사진 업로드"}
      </button>

      {message && (
        <p className="text-sm text-[#29272D]/70">
          {message}
        </p>
      )}
    </div>
  );
}