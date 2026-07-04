import { categoryColor, categoryLabel } from "../../lib/board";

// Per-project archived section (spec). Slides in from the right; each row can be
// restored, which returns the ticket to the column it was archived from.
export default function ArchiveDrawer({ open, tickets, reasonLabels, onClose, onRestore }) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[55] flex justify-end bg-[#04070D]/[0.55] backdrop-blur-[2px]">
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[420px] max-w-full flex-col border-l border-white/[0.08] bg-[#0F1626] shadow-[-30px_0_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[16px] font-bold">Archived</span>
          <span className="rounded-full bg-white/[0.06] px-[7px] py-px font-mono text-[11px] font-semibold text-[#7E8AA3]">
            {tickets.length}
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

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {tickets.length === 0 && (
            <p className="mt-10 text-center text-[13px] text-[#6B7589]">No archived tickets.</p>
          )}
          {tickets.map((t) => {
            const color = categoryColor(t.category);
            return (
              <div
                key={t.id}
                className="relative overflow-hidden rounded-[11px] border border-white/[0.06] bg-[#18223A] p-3 pl-3.5"
              >
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-[#8390AC]">{t.key}</span>
                  <span className="text-[10.5px] font-semibold" style={{ color }}>
                    {categoryLabel(t.category)}
                  </span>
                  <div className="flex-1" />
                  <span className="rounded-[6px] bg-white/[0.05] px-2 py-0.5 text-[10.5px] text-[#9AA6BE]">
                    {reasonLabels[t.archiveReason] || t.archiveReason}
                  </span>
                </div>
                <div className="text-[13.5px] font-semibold leading-[1.34]">{t.title}</div>
                {t.archiveNote && (
                  <div className="mt-1.5 text-[12px] leading-[1.4] text-[#8390AC]">{t.archiveNote}</div>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-[#6B7589]">in {t.columnName}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => onRestore(t)}
                    className="rounded-[8px] border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-[#C2CADB] hover:bg-white/10 hover:text-white"
                  >
                    Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
