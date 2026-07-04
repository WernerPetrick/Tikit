import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";

// Derive a suggested project key from the name: uppercase alphanumerics, capped.
function suggestKey(name) {
  const compact = (name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.slice(0, 6);
}

export default function NewBoardModal({ open, onClose }) {
  const form = useForm({ name: "", key: "", repo_full_name: "" });
  const { data, setData, processing, errors } = form;
  const [keyEdited, setKeyEdited] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset();
      form.clearErrors();
      setKeyEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onName = (value) => {
    setData((prev) => ({
      ...prev,
      name: value,
      key: keyEdited ? prev.key : suggestKey(value),
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    form.post("/projects", { onSuccess: onClose });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#04070D]/[0.66] p-[70px_20px] backdrop-blur-[3px]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-[480px] max-w-full rounded-[16px] border border-white/[0.09] bg-[#0F1626] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center gap-[11px] border-b border-white/[0.07] px-5 py-[18px]">
          <span className="text-[16px] font-bold">New board</span>
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
          <p className="text-[13px] leading-[1.5] text-[#94A0B8]">
            A board maps to a GitHub repository. Pull requests link to its tickets by key.
          </p>

          <Field label="Board name" error={errors.name}>
            <input
              autoFocus
              value={data.name}
              onChange={(e) => onName(e.target.value)}
              placeholder="Acme Web App"
              className="w-full rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] text-[14px] outline-none focus:border-[#FF9A2E]/50"
            />
          </Field>

          <div className="flex gap-[14px]">
            <Field label="Key" error={errors.key} className="w-[140px] flex-none">
              <input
                value={data.key}
                onChange={(e) => {
                  setKeyEdited(true);
                  setData("key", e.target.value.toUpperCase());
                }}
                placeholder="WEB"
                className="w-full rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] font-mono text-[14px] uppercase outline-none focus:border-[#FF9A2E]/50"
              />
            </Field>
            <Field label="GitHub repository" error={errors.repo_full_name} className="flex-1">
              <input
                value={data.repo_full_name}
                onChange={(e) => setData("repo_full_name", e.target.value)}
                placeholder="owner/repo"
                className="w-full rounded-[10px] border border-white/10 bg-[#0A0F1C] px-[13px] py-[11px] font-mono text-[14px] outline-none focus:border-[#FF9A2E]/50"
              />
            </Field>
          </div>

          {data.key && (
            <p className="text-[12px] text-[#6F7B93]">
              Tickets will look like{" "}
              <span className="font-mono text-[#94A0B8]">{data.key || "KEY"}-42</span>.
            </p>
          )}
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
            disabled={processing || !data.name.trim() || !data.key.trim() || !data.repo_full_name.trim()}
            className="rounded-[9px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-[18px] py-2.5 text-[13.5px] font-bold text-white shadow-[0_4px_16px_rgba(255,92,42,0.3)] hover:brightness-105 disabled:opacity-50"
          >
            {processing ? "Creating…" : "Create board"}
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
