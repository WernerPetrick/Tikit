import { useDroppable } from "@dnd-kit/core";

// Fixed at the bottom of the screen, appears only while a card is being dragged.
// Dropping a card here triggers the archive reason modal (spec).
export default function ArchiveDropzone({ active }) {
  const { setNodeRef, isOver } = useDroppable({ id: "archive", data: { type: "archive" } });

  return (
    <div
      className={[
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 transition-all duration-200",
        active ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      ].join(" ")}
    >
      <div
        ref={setNodeRef}
        className={[
          "pointer-events-auto flex w-full max-w-[520px] items-center justify-center gap-2.5 rounded-[14px] border-2 border-dashed py-4 text-[13.5px] font-semibold transition-colors",
          isOver
            ? "border-[#FF7A3C] bg-[#FF7A3C]/[0.18] text-[#FFD2B8]"
            : "border-white/15 bg-[#0F1626]/90 text-[#8390AC] backdrop-blur",
        ].join(" ")}
      >
        <span className="text-[16px]">🗄️</span>
        {isOver ? "Release to archive" : "Drag here to archive"}
      </div>
    </div>
  );
}
