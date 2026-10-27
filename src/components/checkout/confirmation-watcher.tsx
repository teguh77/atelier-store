"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearCartAfterPayment } from "@/lib/checkout/actions";

type Props = {
  sessionId: string;
  status: "pending" | "processing" | "paid" | "failed" | "expired";
};

const POLL_MS = 3000;
const MAX_POLLS = 20; // about a minute

/**
 * Keeps the confirmation page current without ever deciding payment itself.
 * - pending: re-reads the order every few seconds until Stripe's webhook
 *   confirms it, then stops.
 * - paid / processing: asks the server to empty this browser's bag (the
 *   server checks the order really is confirmed and belongs to it).
 */
export function ConfirmationWatcher({ sessionId, status }: Props) {
  const router = useRouter();
  const polls = useRef(0);
  const cleared = useRef(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(() => {
      polls.current += 1;
      if (polls.current > MAX_POLLS) {
        clearInterval(timer);
        setSlow(true);
        return;
      }
      router.refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [status, router]);

  useEffect(() => {
    if ((status === "paid" || status === "processing") && !cleared.current) {
      cleared.current = true;
      void clearCartAfterPayment(sessionId);
    }
  }, [status, sessionId]);

  if (status === "pending" && slow) {
    return (
      <p role="status" className="type-small text-muted">
        This is taking longer than usual. You can safely leave this page; your order will update when
        the payment is confirmed.
      </p>
    );
  }
  return null;
}
