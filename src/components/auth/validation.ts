/*
 * Client-side checks for the sign-in and sign-up forms. The server
 * (Better Auth) checks again; these only give faster, clearer feedback.
 * Password limits match `emailAndPassword` in src/lib/auth.ts.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
const NAME_MAX = 100;

export type AuthMode = "sign-in" | "sign-up";
export type FieldName = "name" | "email" | "password";
export type FieldValues = Record<FieldName, string>;
export type FieldErrors = Partial<Record<FieldName, string>>;

/* Deliberately loose: something@something.tld, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(mode: AuthMode, field: FieldName, value: string): string | undefined {
  switch (field) {
    case "name": {
      if (mode === "sign-in") return undefined;
      const name = value.trim();
      if (!name) return "Enter your name.";
      if (name.length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer.`;
      return undefined;
    }
    case "email": {
      const email = value.trim();
      if (!email) return "Enter your email address.";
      if (!EMAIL_PATTERN.test(email)) return "Enter an email address like name@example.com.";
      return undefined;
    }
    case "password": {
      if (!value) return mode === "sign-up" ? "Choose a password." : "Enter your password.";
      // Sign-in only checks presence, so older passwords never get blocked here.
      if (mode === "sign-in") return undefined;
      if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
      if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
      return undefined;
    }
  }
}

export function fieldsFor(mode: AuthMode): FieldName[] {
  return mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];
}

export function validateAll(mode: AuthMode, values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fieldsFor(mode)) {
    const message = validateField(mode, field, values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

type ServerError = { code?: string; status?: number; message?: string };

/** Where a server error belongs: next to one field, or above the form. */
export type MappedError =
  | { kind: "field"; field: FieldName; message: string }
  | { kind: "form"; message: string; offerSignIn?: boolean };

/** Turns Better Auth error codes into messages written for customers. */
export function mapServerError(error: ServerError): MappedError {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return { kind: "form", message: "That email and password don't match an account. Check them and try again." };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return { kind: "form", message: "An account with this email already exists.", offerSignIn: true };
    case "INVALID_EMAIL":
      return { kind: "field", field: "email", message: "Enter an email address like name@example.com." };
    case "PASSWORD_TOO_SHORT":
      return { kind: "field", field: "password", message: `Use at least ${PASSWORD_MIN} characters.` };
    case "PASSWORD_TOO_LONG":
      return { kind: "field", field: "password", message: `Use ${PASSWORD_MAX} characters or fewer.` };
  }
  if (error.status === 429) {
    return { kind: "form", message: "Too many attempts. Wait a minute, then try again." };
  }
  return { kind: "form", message: "We couldn't complete that just now. Check your connection and try again." };
}
