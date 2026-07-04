// The current Rails CSRF token from the layout meta tag. Used for native (non-
// Inertia) form posts that leave the SPA — e.g. the OmniAuth request phase and
// sign-out — where we need a token valid for the current document.
export function csrfToken() {
  return document.querySelector("meta[name=csrf-token]")?.content || "";
}
