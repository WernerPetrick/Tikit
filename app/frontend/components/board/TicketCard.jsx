import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  aggregatePrState,
  avatarColor,
  categoryColor,
  categoryLabel,
  initials,
  prStateMeta,
} from "../../lib/board";

function PrIcon({ className }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}

// Presentational card — also used inside the DragOverlay (with `overlay`).
export function TicketCardView({ ticket, dragging, overlay }) {
  const color = categoryColor(ticket.category);
  const assignee = ticket.assignee;
  const prState = aggregatePrState(ticket.pullRequests);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[11px] border px-3.5 py-3 pl-3.5",
        "bg-[#18223A] border-white/[0.06] cursor-pointer transition-colors",
        "hover:bg-[#1E2A47] hover:border-white/[0.13]",
        dragging ? "opacity-40" : "",
        overlay ? "shadow-2xl shadow-black/50 rotate-[1.5deg]" : "",
      ].join(" ")}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />

      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
        <span className="font-mono text-[11px] font-semibold text-[#8390AC]">{ticket.key}</span>
        <span className="text-[10.5px] font-semibold" style={{ color }}>
          {categoryLabel(ticket.category)}
        </span>
      </div>

      <div className="text-[13.5px] font-semibold leading-[1.34] text-[#EAEEF7] text-pretty">
        {ticket.title}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {prState && (
          <span
            className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: prStateMeta(prState).color, background: `${prStateMeta(prState).color}1f` }}
            title={`${ticket.pullRequests.length} pull request${ticket.pullRequests.length > 1 ? "s" : ""}`}
          >
            <PrIcon />
            {ticket.pullRequests.length}
          </span>
        )}
        <div className="flex-1" />
        {assignee ? (
          <div
            title={assignee.name}
            className="flex h-[25px] w-[25px] flex-none items-center justify-center rounded-full text-[10.5px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
            style={{ background: avatarColor(assignee) }}
          >
            {initials(assignee.name)}
          </div>
        ) : (
          <div
            title="Unassigned"
            className="flex h-[25px] w-[25px] flex-none items-center justify-center rounded-full border border-dashed border-white/20 text-[10px] text-[#6B7589]"
          >
            —
          </div>
        )}
      </div>
    </article>
  );
}

export default function TicketCard({ ticket, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "ticket", ticket },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onOpen(ticket)}
    >
      <TicketCardView ticket={ticket} dragging={isDragging} />
    </div>
  );
}
