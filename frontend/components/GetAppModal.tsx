"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { buttonClasses, type ButtonVariant } from "./ui";
import { Logo } from "./Logo";
import { CloseIcon, DownloadIcon } from "./icons";

export function GetAppButton({
  children = "Get app",
  variant = "primary",
  className = "",
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses(variant, className)}
      >
        {children}
      </button>
      <GetAppModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function GetAppModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get the Roda app"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-charcoal/30"
      />

      <div className="relative w-full max-w-sm rounded-xl border-2 border-charcoal bg-white p-8 shadow-[6px_6px_0_#111]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-charcoal bg-butter text-charcoal"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <Logo />

        <h3 className="mt-8 text-xl font-semibold tracking-tight text-charcoal">
          Get the Roda app
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Save with your circle on the go. Launching soon on iOS and Android.
        </p>

        <div className="mt-8 space-y-2">
          <StoreOption
            icon={<DownloadIcon className="h-5 w-5" />}
            sub="Available for"
            title="Android APK"
            href="https://expo.dev/artifacts/eas/_XLTAWw5mKtT8RCWInSZkP1WS426tqT1JfiKJJ8zDvs.apk"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StoreOption({
  icon,
  sub,
  title,
  href,
}: {
  icon: ReactNode;
  sub: string;
  title: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="text-charcoal">{icon}</span>
      <span className="flex-1">
        <span className="block text-[11px] text-muted">{sub}</span>
        <span className="block text-sm font-medium text-charcoal">{title}</span>
      </span>
      <span className="text-[11px] text-muted">
        {href ? "Download" : "Soon"}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-lg border-2 border-charcoal px-4 py-3.5 hover:bg-surface-sand"
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      aria-disabled="true"
      className="flex items-center gap-4 rounded-xl border border-border-subtle px-4 py-3.5"
    >
      {inner}
    </div>
  );
}
