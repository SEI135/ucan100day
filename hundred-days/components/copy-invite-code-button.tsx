"use client";

import { useState } from "react";

type Props = {
  code: string;
};

export default function CopyInviteCodeButton({
  code,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-full border border-[#625080] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#625080] transition-colors hover:bg-[#625080] hover:text-white"
    >
      {copied ? "COPIED!" : "COPY"}
    </button>
  );
}