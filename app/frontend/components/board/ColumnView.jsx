import { useState } from "react";
import { router } from "@inertiajs/react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TicketCard, { TicketCardView } from "./TicketCard";

export default function ColumnView({
  column,
  dndEnabled,
  onOpenTicket,
  onAddTicket,
  onRemove,
}) {
  // Column is a horizontal sortable — dragged by the grip handle in the header.
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${column.id}`, data: { type: "column" } });

  // Droppable so a card can land in an empty column or below the last card.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: "column", columnId: column.id },
    disabled: !dndEnabled,
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const startRename = () => {
    setName(column.name);
    setEditing(true);
  };

  const saveRename = () => {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) return;
    router.patch(
      `/columns/${column.id}`,
      { name: trimmed },
      { preserveScroll: true, preserveState: true },
    );
  };

  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <section
      ref={setSortableRef}
      style={style}
      className={[
        "relative flex max-h-full w-[296px] flex-none flex-col rounded-[14px] border border-white/[0.06] bg-[#111A2E]/70",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* header */}
      <div className="flex flex-none items-center gap-1.5 px-3 pb-2.5 pt-3.5">
        <button
          {...attributes}
          {...listeners}
          title="Drag to reorder column"
          className="flex h-6 w-4 cursor-grab items-center justify-center text-[13px] text-[#5B6680] hover:text-[#9AA6BE] active:cursor-grabbing"
        >
          ⠿
        </button>

        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") setEditing(false);
            }}
            className="min-w-0 flex-1 rounded-[6px] border border-white/[0.14] bg-[#0E1424] px-2 py-0.5 text-[13.5px] font-bold outline-none focus:border-[#FF9A2E]/60"
          />
        ) : (
          <span
            onDoubleClick={startRename}
            title="Double-click to rename"
            className="cursor-text text-[13.5px] font-bold tracking-[0.01em]"
          >
            {column.name}
          </span>
        )}

        <span className="rounded-full bg-white/[0.06] px-[7px] py-px font-mono text-[11px] font-semibold text-[#7E8AA3]">
          {column.tickets.length}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onAddTicket(column.id)}
          title="Add ticket"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[17px] text-[#9AA6BE] hover:bg-white/[0.08] hover:text-white"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onRemove(column)}
          title="Remove column"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[14px] text-[#6B7589] hover:bg-[#FB5A5A]/[0.16] hover:text-[#FB5A5A]"
        >
          ✕
        </button>
      </div>

      {/* tickets */}
      <div
        ref={setDropRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-3 pt-0.5"
      >
        {dndEnabled ? (
          <SortableContext
            items={column.tickets.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onOpen={onOpenTicket} />
            ))}
          </SortableContext>
        ) : (
          column.tickets.map((ticket) => (
            <div key={ticket.id} onClick={() => onOpenTicket(ticket)}>
              <TicketCardView ticket={ticket} />
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => onAddTicket(column.id)}
          className="mt-0.5 rounded-[9px] border border-dashed border-white/10 p-2.5 text-left text-[12.5px] font-semibold text-[#7E8AA3] hover:border-[#FF9A2E]/50 hover:text-[#FF9A2E]"
        >
          + Add ticket
        </button>
      </div>

      {isOver && (
        <div className="pointer-events-none absolute inset-0 rounded-[14px] border-2 border-dashed border-[#FF7A3C] bg-[#FF7A3C]/[0.07]" />
      )}
    </section>
  );
}
