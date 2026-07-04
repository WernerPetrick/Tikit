import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

// Asks for a reason (required dropdown) + optional note, per spec. Archiving is
// soft and terminal; the ticket keeps its column and stays restorable.
export default function ArchiveModal({ open, ticket, reasons, reasonLabels, onClose }) {
  const form = useForm({ reason: reasons[0] || "completed", note: "" });
  const { data, setData, processing } = form;

  useEffect(() => {
    if (open) setData({ reason: reasons[0] || "completed", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?.id]);

  if (!open || !ticket) return null;

  const submit = (e) => {
    e.preventDefault();
    form.post(`/tickets/${ticket.id}/archive`, { onSuccess: onClose });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#04070D]/[0.66] p-[80px_20px] backdrop-blur-[3px]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-[440px] max-w-full rounded-[16px] border border-white/[0.09] bg-[#0F1626] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center gap-[11px] border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[16px] font-bold">Archive ticket</span>
          <span className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 font-mono text-[12px] text-[#7E8AA3]">
            {ticket.key}
          </span>
        </div>

        <div className="flex flex-col gap-[15px] px-5 py-[18px]">
          <p className="text-[13px] leading-[1.5] text-[#9AA6BE]">
            Archiving keeps <span className="font-semibold text-[#EAEEF7]">{ticket.key}</span> and its
            column — it's hidden from the board but restorable from the archive.
          </p>

          <label className="block">
            <span className="mb-[7px] block text-[12px] font-semibold text-[#9AA6BE]">Reason</span>
            <div className="relative">
              <select
                value={data.reason}
                onChange={(e) => setData("reason", e.target.value)}
                className="w-full appearance-none rounded-[10px] border border-white/10 bg-[#0A0F1C] py-[11px] pl-[13px] pr-8 text-[14px] outline-none focus:border-[#FF9A2E]/50"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {reasonLabels[r] || r}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-[11px] text-[#7E8AA3]">
                ▾
              </span>
            </div>
          </label>

          <label className="block">
            <span className="mb-[7px] block text-[12px] font-semibold text-[#9AA6BE]">
              Note <span className="font-normal text-[#6B7589]">(optional)</span>
            </span>
            <textarea
              value={data.note}
              onChange={(e) => setData("note", e.target.value)}
              rows={2}
              placeholder="Any context for why this was archived…"
              className="min-h-[60px] w-full resize-y rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] text-[13.5px] leading-[1.5] outline-none focus:border-[#FF9A2E]/50"
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
            disabled={processing}
            className="rounded-[9px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-[18px] py-2.5 text-[13.5px] font-bold text-white shadow-[0_4px_16px_rgba(255,92,42,0.3)] hover:brightness-105 disabled:opacity-50"
          >
            Archive ticket
          </button>
        </div>
      </form>
    </div>
  );
}
