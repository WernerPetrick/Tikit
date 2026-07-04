import { useState } from "react";
import { Head } from "@inertiajs/react";
import NewBoardModal from "../components/board/NewBoardModal";

export default function NoBoards() {
  const [open, setOpen] = useState(false);

  return (
    <div className="tikit-login-bg flex min-h-screen w-full flex-col items-center justify-center p-8">
      <Head title="Create your first board · Tikit" />

      <div className="flex items-center gap-3.5">
        <img src="/brand/tikit_logo.webp" alt="Tikit" className="block h-[44px] w-auto" />
        <span className="bg-gradient-to-br from-[#FFB24D] via-[#FF5C2A] to-[#FF3E3F] bg-clip-text text-[30px] font-extrabold tracking-[-0.02em] text-transparent">
          tikit
        </span>
      </div>

      <div className="mt-7 w-[440px] max-w-full rounded-[18px] border border-white/[0.08] bg-[#0F1626]/[0.72] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-[10px]">
        <h1 className="text-[20px] font-extrabold tracking-[-0.01em]">No boards yet</h1>
        <p className="mt-2 text-[14px] leading-[1.55] text-[#94A0B8]">
          Create your first board and link it to a GitHub repository. Pull requests will link to its
          tickets by key.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-[11px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(255,92,42,0.34)] hover:brightness-105"
        >
          <span className="text-[17px] leading-none">+</span> New board
        </button>
      </div>

      <NewBoardModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
