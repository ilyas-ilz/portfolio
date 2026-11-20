"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { playClickSound, playHoverSound } from "@/lib/sound";

interface CopyEmailProps {
  email: string;
}

/** Copies the address to the clipboard and confirms it for a moment. */
export default function CopyEmail({ email }: CopyEmailProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      className="contact-tile"
      onClick={copy}
      onMouseEnter={playHoverSound}
    >
      <small>
        <span>Direct Email</span>
        <span className="copy-state" aria-live="polite">
          {copied ? <Check className="icon" aria-hidden="true" /> : <Copy className="icon" aria-hidden="true" />}
          {copied ? "Copied to clipboard" : "Click to copy"}
        </span>
      </small>
      <b>{email}</b>
    </button>
  );
}
