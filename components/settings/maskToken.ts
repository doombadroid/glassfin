// The token signs in as this user, so the screen only shows enough of it to
// tell two apart: screenshots and screen sharing must not leak it.
export const maskToken = (token?: string | null) =>
  token ? `•••• ${token.slice(-4)}` : undefined;
