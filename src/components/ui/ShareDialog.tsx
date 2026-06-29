"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaEnvelope,
  FaFacebookF,
  FaLink,
  FaLinkedinIn,
  FaRedditAlien,
  FaShareAlt,
  FaTelegramPlane,
  FaTimes,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import {
  buildShareTarget,
  copyToClipboard,
  type ShareChannel,
  type ShareMeta,
} from "@/lib/share";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Canonical URL of the thing being shared (no UTM — the dialog adds it). */
  url: string;
  /** Title shown in share targets and the dialog header. */
  title: string;
  /** Short description/excerpt — used by email body, native sheet text. */
  text?: string;
  /** Optional notification — fires once per channel click. Fire-and-forget. */
  onShared?: (channel: ShareChannel) => void;
};

type ChannelButton = {
  channel: ShareChannel;
  label: string;
  icon: React.ReactNode;
  /** Tailwind bg + hover for the icon tile. */
  color: string;
};

/**
 * The order here is the rendered order. We lead with the highest-intent
 * channels for a blog audience (Twitter/X, WhatsApp, LinkedIn) and put
 * utility actions (Copy, Email) last.
 */
const CHANNELS: ChannelButton[] = [
  {
    channel: "twitter",
    label: "X / Twitter",
    icon: <FaTwitter />,
    color: "bg-black hover:bg-gray-800 text-white",
  },
  {
    channel: "whatsapp",
    label: "WhatsApp",
    icon: <FaWhatsapp />,
    color: "bg-[#25D366] hover:bg-[#1ebe57] text-white",
  },
  {
    channel: "facebook",
    label: "Facebook",
    icon: <FaFacebookF />,
    color: "bg-[#1877F2] hover:bg-[#0f64d2] text-white",
  },
  {
    channel: "linkedin",
    label: "LinkedIn",
    icon: <FaLinkedinIn />,
    color: "bg-[#0A66C2] hover:bg-[#0856a8] text-white",
  },
  {
    channel: "telegram",
    label: "Telegram",
    icon: <FaTelegramPlane />,
    color: "bg-[#229ED9] hover:bg-[#1d87b8] text-white",
  },
  {
    channel: "reddit",
    label: "Reddit",
    icon: <FaRedditAlien />,
    color: "bg-[#FF4500] hover:bg-[#dd3a00] text-white",
  },
  {
    channel: "email",
    label: "Email",
    icon: <FaEnvelope />,
    color: "bg-gray-600 hover:bg-gray-700 text-white",
  },
];

export default function ShareDialog({
  open,
  onClose,
  url,
  title,
  text,
  onShared,
}: Props) {
  const { showToast } = useToast();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  // navigator.share is only available in client + over HTTPS on most browsers.
  // Detect once on mount so we don't show "Share via device" on desktops where
  // clicking it would be a no-op.
  useEffect(() => {
    setHasNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  // Modal scaffolding: scroll lock, ESC to close, focus the close button so
  // keyboard users land somewhere safe.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  // Reset the "Copied!" pill state any time the dialog reopens.
  useEffect(() => {
    if (!open) {
      setCopied(false);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    }
  }, [open]);

  const meta: ShareMeta = useMemo(() => ({ url, title, text }), [url, title, text]);

  const recordShare = useCallback(
    (channel: ShareChannel) => {
      // Fire-and-forget. Tracking is best-effort — if it fails, the user
      // already shared, so we don't want to surface an error.
      onShared?.(channel);
    },
    [onShared],
  );

  const handleChannel = useCallback(
    (channel: ShareChannel) => {
      const target = buildShareTarget(channel, meta);
      if (!target) return;
      // `noopener` is critical — the share popup must not be able to navigate
      // the parent window via window.opener.
      window.open(target, "_blank", "noopener,noreferrer");
      recordShare(channel);
    },
    [meta, recordShare],
  );

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      showToast("Link copied to clipboard.", "success");
      recordShare("copy");
    } else {
      showToast("Could not copy. Long-press the link to copy manually.", "error");
    }
  }, [url, showToast, recordShare]);

  const handleNative = useCallback(async () => {
    if (!hasNativeShare) return;
    try {
      // The user-facing system sheet (iOS/Android/most modern browsers).
      // Tracking fires BEFORE share so we count even if the user dismisses
      // the sheet — same convention browsers themselves follow for analytics.
      recordShare("native");
      await navigator.share({ url, title, text });
      onClose();
    } catch (err: any) {
      // AbortError is the user dismissing the sheet — not a real error.
      if (err?.name !== "AbortError") {
        showToast("Could not open the share sheet.", "error");
      }
    }
  }, [hasNativeShare, url, title, text, recordShare, onClose, showToast]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/*
        Bottom-sheet on mobile, centered card on >= sm. The slide-up animation
        on mobile matches what users expect from a native share sheet.
      */}
      <div
        className="w-full sm:max-w-md bg-white dark:bg-dark-100 border-t sm:border border-gray-200 dark:border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              id="share-dialog-title"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              Share this post
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[260px]">
              {title}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="shrink-0 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FaTimes />
          </button>
        </div>

        {/* Channel grid — 4 columns on mobile gives a good touch target without
            forcing horizontal scroll on smaller phones. */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {CHANNELS.map((c) => (
            <button
              key={c.channel}
              type="button"
              onClick={() => handleChannel(c.channel)}
              className="flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
              aria-label={`Share to ${c.label}`}
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm transition ${c.color}`}
              >
                {c.icon}
              </span>
              <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate w-full text-center">
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* Copy-link row — separated because it's the most-used action and we
            want it always visible without scrolling. */}
        <div className="flex items-stretch gap-2 mb-3">
          <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 truncate">
            {url}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-2 px-4 rounded-lg font-medium text-sm transition ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            aria-live="polite"
          >
            {copied ? (
              <>
                <FaCheck /> Copied
              </>
            ) : (
              <>
                <FaLink /> Copy
              </>
            )}
          </button>
        </div>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNative}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <FaShareAlt /> More sharing options
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
