import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TicketCard, { TicketCardView } from "./TicketCard";

export default function ColumnView({
  column,
  dndEnabled,
  onOpenTicket,
  onAddTicket,
  onRemove,
}) {
  // Droppable so a card can land in an empty column or below the last card.
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: "column", columnId: column.id },
    disabled: !dndEnabled,
  });

  return (
    <section className="relative flex max-h-full w-[296px] flex-none flex-col rounded-[14px] border border-white/[0.06] bg-[#111A2E]/70">
      {/* header */}
      <div className="flex flex-none items-center gap-2.5 px-3 pb-2.5 pt-3.5">
        <span className="text-[13.5px] font-bold tracking-[0.01em]">{column.name}</span>
        <span className="rounded-full bg-white/[0.06] px-[7px] py-px font-mono text-[11px] font-semibold text-[#7E8AA3]">
          {column.tickets.length}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onAddTicket(column.id)}
          title="Add ticket"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[17px] text-[#9AA6BE] hover:bg-white/[0.08] hover:text-white"
        >
          +
        </button>
        <button
          onClick={() => onRemove(column)}
          title="Remove column"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[14px] text-[#6B7589] hover:bg-[#FB5A5A]/[0.16] hover:text-[#FB5A5A]"
        >
          ✕
        </button>
      </div>

      {/* tickets */}
      <div
        ref={setNodeRef}
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
