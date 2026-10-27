import { cn } from "@/lib/cn";

export type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

/**
 * Result line under an account form. Always rendered (empty when idle) so
 * screen readers announce the message when it appears.
 */
export function FormStatus({ status }: { status: Status }) {
  const message = status.kind === "success" || status.kind === "error" ? status.message : "";
  return (
    <p
      role="status"
      className={cn("type-small min-h-5", status.kind === "error" && "text-error")}
    >
      {message}
    </p>
  );
}

type ServerError = { code?: string; status?: number };

/** Fallback messages for errors that aren't about a specific field. */
export function serverErrorMessage(error: ServerError) {
  if (error.status === 401 || error.code === "SESSION_EXPIRED") {
    return "Your session has ended. Sign in again, then retry.";
  }
  if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
  return "We couldn't save that just now. Check your connection and try again.";
}
