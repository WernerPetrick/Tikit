import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { categoryColor, categoryLabel, prStateMeta } from "../../lib/board";

const EMPTY = { title: "", description: "", category: "feature", assignee_id: "" };

export default function TicketModal({
  open,
  ticket, // null => create
  columnId, // target column for create
  projectId,
  team,
  categories,
  onClose,
  onArchive,
}) {
  const editing = Boolean(ticket);

  const form = useForm(
    editing
      ? {
          title: ticket.title,
          description: ticket.description || "",
          category: ticket.category,
          assignee_id: ticket.assignee?.id ?? "",
        }
      : { ...EMPTY },
  );
  const { data, setData, processing, errors } = form;

  // Reset the form whenever a different ticket / column is opened.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setDefaults();
      setData({
        title: ticket.title,
        description: ticket.description || "",
        category: ticket.category,
        assignee_id: ticket.assignee?.id ?? "",
      });
    } else {
      setData({ ...EMPTY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?.id, columnId]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!data.title.trim()) return;
    if (editing) {
      form.patch(`/tickets/${ticket.id}`, { onSuccess: onClose });
    } else {
      form.transform((d) => ({ ...d, project_id: projectId, column_id: columnId })).post("/tickets", {
        onSuccess: onClose,
      });
    }
  };

  const dot = categoryColor(data.category);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-[fadeIn_0.14s_ease] items-start justify-center overflow-y-auto bg-[#04070D]/[0.66] p-[60px_20px] backdrop-blur-[3px]"
      style={{ animationName: "fadeIn" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-[540px] max-w-full rounded-[16px] border border-white/[0.09] bg-[#0F1626] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        {/* header */}
        <div className="flex items-center gap-[11px] border-b border-white/[0.07] px-5 py-[18px]">
          <div className="h-2 w-2 rounded-full" style={{ background: dot }} />
          <span className="text-[16px] font-bold">{editing ? "Edit ticket" : "New ticket"}</span>
          {editing && (
            <span className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 font-mono text-[12px] text-[#7E8AA3]">
              {ticket.key}
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[16px] text-[#8390AC] hover:bg-white/[0.07] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex flex-col gap-[15px] px-5 py-[18px]">
          <Field label="Title" error={errors.title}>
            <input
              autoFocus
              value={data.title}
              onChange={(e) => setData("title", e.target.value)}
              placeholder="Short summary of the ticket"
              className="w-full rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] text-[14px] outline-none focus:border-[#FF9A2E]/50"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              rows={3}
              placeholder="Add more detail, repro steps, links…"
              className="min-h-[78px] w-full resize-y rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] text-[13.5px] leading-[1.5] outline-none focus:border-[#FF9A2E]/50"
            />
          </Field>

          <div className="flex gap-[14px]">
            <Field label="Assignee" className="flex-1">
              <Select value={data.assignee_id} onChange={(v) => setData("assignee_id", v)}>
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category" error={errors.category} className="flex-1">
              <Select value={data.category} onChange={(v) => setData("category", v)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {editing && ticket.pullRequests?.length > 0 && (
            <div>
              <span className="mb-[7px] block text-[12px] font-semibold text-[#9AA6BE]">
                Linked pull requests
              </span>
              <div className="flex flex-col gap-1.5">
                {ticket.pullRequests.map((pr) => {
                  const meta = prStateMeta(pr.state);
                  return (
                    <a
                      key={pr.id}
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.07] bg-[#0A0F1C] px-3 py-2.5 hover:border-white/[0.16]"
                    >
                      <span
                        className="rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-bold"
                        style={{ color: meta.color, background: `${meta.color}1f` }}
                      >
                        {meta.label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{pr.title}</span>
                      <span className="font-mono text-[11px] text-[#7E8AA3]">#{pr.number}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-2.5 border-t border-white/[0.07] px-5 py-4">
          {editing && (
            <button
              type="button"
              onClick={() => onArchive(ticket)}
              className="rounded-[9px] border border-[#FB5A5A]/[0.28] bg-[#FB5A5A]/[0.12] px-3.5 py-2.5 text-[13px] font-bold text-[#FB5A5A] hover:bg-[#FB5A5A]/20"
            >
              Archive
            </button>
          )}
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
            disabled={processing || !data.title.trim()}
            className="rounded-[9px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-[18px] py-2.5 text-[13.5px] font-bold text-white shadow-[0_4px_16px_rgba(255,92,42,0.3)] hover:brightness-105 disabled:opacity-50"
          >
            {editing ? "Save changes" : "Create ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-[7px] block text-[12px] font-semibold text-[#9AA6BE]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-[#FB5A5A]">{error}</span>}
    </label>
  );
}

function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-[10px] border border-white/10 bg-[#0A0F1C] py-[11px] pl-[13px] pr-8 text-[14px] outline-none focus:border-[#FF9A2E]/50"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-[11px] text-[#7E8AA3]">
        ▾
      </span>
    </div>
  );
}
