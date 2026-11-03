"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CookieIcon, CloseIcon } from "./icons";

export function CookiesNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    // Forcing it to always show for now so you can see it!
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-[60] md:left-auto md:w-full md:max-w-[380px] md:bottom-8 md:right-8">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-white p-6 ring-1 ring-black/5 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender/60">
              <CookieIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-charcoal">Cookie Notice</h3>
          </div>
          
          <div className="flex-1 w-full">
            <p className="text-[13px] leading-relaxed text-muted">
              We use cookies to provide necessary site functionality and improve your experience. By continuing, you agree to our use of cookies.{" "}
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="font-medium text-primary underline underline-offset-2 hover:text-primary-light"
              >
                Privacy details
              </button>
            </p>
          </div>

          <div className="flex w-full shrink-0 items-center gap-3">
            <button
              onClick={handleDecline}
              className="flex h-10 flex-1 items-center justify-center rounded-full border border-border-subtle bg-white px-4 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-sand"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary-light"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
      
      <PrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
}

function PrivacyModal({
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Privacy details"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-charcoal/40 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-white p-8 max-h-[85vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-sand hover:text-charcoal transition-colors"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <h3 className="text-xl font-semibold tracking-tight text-charcoal">
          Privacy details
        </h3>
        
        <div className="mt-6 flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          <section>
            <h4 className="font-semibold text-charcoal text-sm">Essential Cookies</h4>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You may disable these by changing your browser settings, but this may affect how the website functions.
            </p>
          </section>
          
          <section>
            <h4 className="font-semibold text-charcoal text-sm">Analytics Cookies</h4>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              We use analytics cookies to help us improve our website by collecting and reporting information on how you use it. The cookies collect information in a way that does not directly identify anyone.
            </p>
          </section>
          
          <section>
            <h4 className="font-semibold text-charcoal text-sm">Third-party Services</h4>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Some of our pages display content from external providers. To view this third-party content, you first have to accept their specific terms and conditions. This includes their cookie policies, which we have no control over.
            </p>
          </section>
        </div>
        
        <div className="mt-8 pt-4 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
