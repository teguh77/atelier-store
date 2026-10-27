import { createAuthClient } from "better-auth/react";

/* No baseURL: the client calls /api/auth on the same origin the page was served from. */
export const authClient = createAuthClient();
