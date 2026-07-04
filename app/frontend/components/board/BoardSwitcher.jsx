import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

export default function BoardSwitcher({ project, projects, onNewBoard, onDeleteBoard }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = projects.find((p) => p.id === project.id) || project;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const switchTo = (p) => {
    setOpen(false);
    if (p.id !== project.id) router.visit(`/projects/${p.id}/board`);
  };

  const repoLabel = (full) => {
    if (!full) return null;
    const [owner, name] = full.split("/");
    return (
      <>
        <span className="font-mono text-[12px] text-[#7E8AA3]">{owner}/</span>
        <span>{name}</span>
      </>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[8px] border border-white/[0.08] bg-white/[0.045] px-[11px] py-1.5 text-[13px] font-semibold hover:bg-white/[0.07]"
      >
        {current.repoFullName ? (
          repoLabel(current.repoFullName)
        ) : (
          <span>{current.name}</span>
        )}
        <span className="rounded bg-white/[0.06] px-1.5 py-px font-mono text-[10.5px] text-[#7E8AA3]">
          {current.key}
        </span>
        <span className="text-[11px] text-[#7E8AA3]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[280px] rounded-[12px] border border-white/[0.08] bg-[#0F1626] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            <div className="px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7589]">
              Boards
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {projects.map((p) => {
                const active = p.id === project.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => switchTo(p)}
                    className={[
                      "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left",
                      active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] bg-gradient-to-br from-[#FF9A2E] to-[#FF3E3F] font-mono text-[10px] font-bold text-white">
                      {p.key.slice(0, 3)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                      <span className="block truncate font-mono text-[11px] text-[#7E8AA3]">
                        {p.repoFullName || "no repo linked"}
                      </span>
                    </span>
                    {active && <span className="text-[12px] text-[#FF9A2E]">●</span>}
                  </button>
                );
              })}
            </div>
            <div className="my-1.5 h-px bg-white/[0.07]" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNewBoard();
              }}
              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-semibold text-[#FF9A2E] hover:bg-[#FF9A2E]/[0.1]"
            >
              <span className="text-[16px] leading-none">+</span> New board
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDeleteBoard();
              }}
              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-semibold text-[#8390AC] hover:bg-[#FB5A5A]/[0.12] hover:text-[#FB5A5A]"
            >
              <span className="text-[14px] leading-none">🗑</span> Delete this board
            </button>
          </div>
      )}
    </div>
  );
}
