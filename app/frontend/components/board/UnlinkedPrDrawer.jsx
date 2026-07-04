import { prStateMeta } from "../../lib/board";

// The "unlinked PRs" surface (spec): pull requests whose title carries no valid
// ticket key — stored and visible rather than dropped. Read-only; a PR links by
// adding [KEY-n] to the end of its title on GitHub (re-runs on the edited event).
export default function UnlinkedPrDrawer({ open, pullRequests, projectKey, onClose }) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[55] flex justify-end bg-[#04070D]/[0.55] backdrop-blur-[2px]">
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[440px] max-w-full flex-col border-l border-white/[0.08] bg-[#0F1626] shadow-[-30px_0_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[16px] font-bold">Unlinked PRs</span>
          <span className="rounded-full bg-white/[0.06] px-[7px] py-px font-mono text-[11px] font-semibold text-[#7E8AA3]">
            {pullRequests.length}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[16px] text-[#8390AC] hover:bg-white/[0.07] hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white/[0.06] px-5 py-3 text-[12px] leading-[1.5] text-[#7E8AA3]">
          Add{" "}
          <span className="font-mono text-[#94A0B8]">[{projectKey}-42]</span> to the end of a PR
          title on GitHub to link it to that ticket.
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {pullRequests.length === 0 && (
            <p className="mt-10 text-center text-[13px] text-[#6B7589]">
              No unlinked pull requests. 🎉
            </p>
          )}
          {pullRequests.map((pr) => {
            const meta = prStateMeta(pr.state);
            return (
              <a
                key={pr.id}
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[11px] border border-white/[0.06] bg-[#18223A] p-3 hover:border-white/[0.14]"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-bold"
                    style={{ color: meta.color, background: `${meta.color}1f` }}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#7E8AA3]">
                    {pr.repoFullName} #{pr.number}
                  </span>
                </div>
                <div className="text-[13.5px] font-semibold leading-[1.34]">{pr.title}</div>
                {pr.authorLogin && (
                  <div className="mt-1.5 font-mono text-[11px] text-[#6B7589]">@{pr.authorLogin}</div>
                )}
              </a>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
