import { Head, usePage } from "@inertiajs/react";

// CSRF token from the layout meta tag, injected into native form POSTs (the
// OmniAuth request phase leaves the SPA, so we submit a real form, not Inertia).
function csrfToken() {
  return document.querySelector("meta[name=csrf-token]")?.content || "";
}

function CsrfInput() {
  return <input type="hidden" name="authenticity_token" value={csrfToken()} />;
}

export default function Login() {
  const { props } = usePage();
  const flash = props.flash || {};
  const devLogin = props.devLogin;

  return (
    <div className="tikit-login-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden p-8">
      <Head title="Sign in · Tikit" />

      {/* decorative floating board slivers */}
      <div
        className="pointer-events-none absolute right-[-60px] top-1/2 flex gap-3.5 opacity-[0.14]"
        style={{ transform: "translateY(-50%) rotate(-8deg)", filter: "blur(0.3px)" }}
        aria-hidden="true"
      >
        {[320, 380, 280].map((h, i) => (
          <div
            key={h}
            className="w-[150px] rounded-[16px] border border-white/[0.06] bg-[#18223A]/90"
            style={{ height: h, animation: `floaty 7s ease-in-out infinite ${[0, 1.4, 0.7][i]}s` }}
          />
        ))}
      </div>

      <main className="relative z-[1] w-[420px] max-w-full" style={{ animation: "rise 0.5s ease both" }}>
        {/* brand */}
        <div className="mb-[30px] flex items-center gap-3.5">
          <img
            src="/brand/tikit_logo.webp"
            alt="Tikit"
            className="block h-[50px] w-auto"
            style={{ filter: "drop-shadow(0 8px 22px rgba(255,92,42,0.35))" }}
          />
          <span className="bg-gradient-to-br from-[#FFB24D] via-[#FF5C2A] to-[#FF3E3F] bg-clip-text text-[34px] font-extrabold tracking-[-0.02em] text-transparent">
            tikit
          </span>
        </div>

        <div className="rounded-[18px] border border-white/[0.08] bg-[#0F1626]/[0.72] p-[30px_30px_26px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-[10px]">
          {flash.alert && (
            <div className="mb-4 rounded-[10px] border border-[#FB5A5A]/30 bg-[#FB5A5A]/[0.12] px-3.5 py-3 text-[12.5px] leading-[1.4] text-[#FFC2C2]">
              {flash.alert}
            </div>
          )}

          {/* OmniAuth request phase is a CSRF-protected POST */}
          <form method="post" action="/auth/github">
            <CsrfInput />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-[11px] rounded-[12px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] p-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(255,92,42,0.34)] transition hover:brightness-[1.06] active:translate-y-px"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.11-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.19.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22 0 1.6-.02 2.9-.02 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
              </svg>
              Continue with GitHub
            </button>
          </form>

          <p className="mt-4 text-center text-[12.5px] leading-[1.5] text-[#6F7B93]">
            New here? Continuing with GitHub creates your account.
          </p>

          {devLogin && (
            <form method="post" action="/dev_login" className="mt-4 border-t border-white/[0.07] pt-4">
              <CsrfInput />
              <input type="hidden" name="login" value="maya" />
              <button
                type="submit"
                className="w-full rounded-[10px] border border-dashed border-white/15 py-2.5 text-[12.5px] font-semibold text-[#94A0B8] hover:border-white/30 hover:text-[#EAEEF7]"
              >
                Dev sign-in (no OAuth configured)
              </button>
            </form>
          )}
        </div>

        <p className="mt-[22px] px-1 text-center text-[12px] leading-[1.5] text-[#5B6680]">
          By continuing you agree to the <span className="text-[#94A0B8]">Terms</span> &amp;{" "}
          <span className="text-[#94A0B8]">Privacy Policy</span>.
        </p>
      </main>
    </div>
  );
}
