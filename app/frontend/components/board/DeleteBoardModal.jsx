import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

// Type-the-key confirmation for an irreversible, cascading delete.
export default function DeleteBoardModal({ open, project, ticketCount, onClose }) {
  const [confirm, setConfirm] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirm("");
      setProcessing(false);
    }
  }, [open]);

  if (!open || !project) return null;

  const matches = confirm.trim().toUpperCase() === project.key.toUpperCase();

  const submit = (e) => {
    e.preventDefault();
    if (!matches) return;
    setProcessing(true);
    router.delete(`/projects/${project.id}`, {
      // The root redirect re-renders the same Board component, so its state
      // (deleteBoardOpen) survives the visit — close the modal explicitly.
      onSuccess: onClose,
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#04070D]/[0.66] p-[70px_20px] backdrop-blur-[3px]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-[460px] max-w-full rounded-[16px] border border-[#FB5A5A]/[0.25] bg-[#0F1626] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center gap-[11px] border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[16px] font-bold text-[#FB5A5A]">Delete board</span>
          <span className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 font-mono text-[12px] text-[#7E8AA3]">
            {project.key}
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

        <div className="flex flex-col gap-[15px] px-5 py-[18px]">
          <div className="rounded-[10px] border border-[#FB5A5A]/25 bg-[#FB5A5A]/[0.1] px-3.5 py-3 text-[13px] leading-[1.5] text-[#FFC2C2]">
            This permanently deletes <span className="font-semibold">{project.name}</span>, including{" "}
            <span className="font-semibold">
              {ticketCount} ticket{ticketCount === 1 ? "" : "s"}
            </span>
            , its columns, linked pull requests, and activity. This can't be undone.
          </div>

          <label className="block">
            <span className="mb-[7px] block text-[12px] font-semibold text-[#9AA6BE]">
              Type <span className="font-mono text-[#EAEEF7]">{project.key}</span> to confirm
            </span>
            <input
              autoFocus
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={project.key}
              className="w-full rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] font-mono text-[14px] uppercase outline-none focus:border-[#FB5A5A]/60"
            />
          </label>
        </div>

        <div className="flex items-center gap-2.5 border-t border-white/[0.07] px-5 py-4">
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9px] bg-white/[0.06] px-4 py-2.5 text-[13.5px] font-semibold text-[#C2CADB] hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!matches || processing}
            className="rounded-[9px] bg-[#FB5A5A] px-[18px] py-2.5 text-[13.5px] font-bold text-white shadow-[0_4px_16px_rgba(251,90,90,0.3)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processing ? "Deleting…" : "Delete board"}
          </button>
        </div>
      </form>
    </div>
  );
}
