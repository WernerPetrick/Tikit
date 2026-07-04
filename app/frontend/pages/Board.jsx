import { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import TopBar from "../components/board/TopBar";
import ColumnView from "../components/board/ColumnView";
import TicketModal from "../components/board/TicketModal";
import ArchiveModal from "../components/board/ArchiveModal";
import ArchiveDrawer from "../components/board/ArchiveDrawer";
import ArchiveDropzone from "../components/board/ArchiveDropzone";
import NewBoardModal from "../components/board/NewBoardModal";
import DeleteBoardModal from "../components/board/DeleteBoardModal";
import UnlinkedPrDrawer from "../components/board/UnlinkedPrDrawer";
import { TicketCardView } from "../components/board/TicketCard";
import { ARCHIVE_REASON_LABELS } from "../lib/board";

const isColId = (id) => typeof id === "string" && id.startsWith("col-");

export default function Board(props) {
  const {
    project,
    team,
    categories,
    archiveReasons,
    archivedTickets = [],
    unlinkedPullRequests = [],
  } = props;

  // Local board state, kept in sync with server props (after each persist the
  // server redirect reloads props and we reconcile here).
  const [columns, setColumns] = useState(props.columns);
  useEffect(() => setColumns(props.columns), [props.columns]);

  const [filterUser, setFilterUser] = useState("all");
  const dndEnabled = filterUser === "all";

  const [activeId, setActiveId] = useState(null);
  const [ticketModal, setTicketModal] = useState({ open: false, ticket: null, columnId: null });
  const [archiveModal, setArchiveModal] = useState({ open: false, ticket: null });
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [prDrawerOpen, setPrDrawerOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newCol, setNewCol] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const viewColumns = useMemo(() => {
    if (dndEnabled) return columns;
    return columns.map((c) => ({
      ...c,
      tickets: c.tickets.filter((t) =>
        filterUser === "unassigned" ? !t.assignee : String(t.assignee?.id) === String(filterUser),
      ),
    }));
  }, [columns, filterUser, dndEnabled]);

  const activeTicket = useMemo(
    () => columns.flatMap((c) => c.tickets).find((t) => String(t.id) === String(activeId)) || null,
    [columns, activeId],
  );

  const defaultColumnId = columns[0]?.id ?? null;

  // ---- container lookup ----
  const findContainer = (id) => {
    if (id == null) return null;
    if (isColId(id)) return Number(id.slice(4));
    if (id === "archive") return null;
    const col = columns.find((c) => c.tickets.some((t) => String(t.id) === String(id)));
    return col ? col.id : null;
  };

  // ---- drag handlers ----
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragOver = ({ active, over }) => {
    if (!over || over.id === "archive") return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (from == null || to == null || from === to) return;

    setColumns((prev) => {
      const fromCol = prev.find((c) => c.id === from);
      const toCol = prev.find((c) => c.id === to);
      const moving = fromCol?.tickets.find((t) => String(t.id) === String(active.id));
      if (!moving) return prev;

      const overIndex = isColId(over.id)
        ? toCol.tickets.length
        : toCol.tickets.findIndex((t) => String(t.id) === String(over.id));
      const insertAt = overIndex < 0 ? toCol.tickets.length : overIndex;

      return prev.map((c) => {
        if (c.id === from) {
          return { ...c, tickets: c.tickets.filter((t) => String(t.id) !== String(active.id)) };
        }
        if (c.id === to) {
          const next = c.tickets.slice();
          next.splice(insertAt, 0, { ...moving, columnId: to });
          return { ...c, tickets: next };
        }
        return c;
      });
    });
  };

  const handleDragEnd = ({ active, over }) => {
    const id = active.id;
    setActiveId(null);
    if (!over) return;

    // Dropped on the archive zone → revert optimistic move, open reason modal.
    if (over.id === "archive") {
      const ticket = columns.flatMap((c) => c.tickets).find((t) => String(t.id) === String(id));
      setColumns(props.columns);
      if (ticket) setArchiveModal({ open: true, ticket });
      return;
    }

    const to = findContainer(over.id);
    if (to == null) return;

    setColumns((prev) => {
      const toCol = prev.find((c) => c.id === to);
      if (!toCol) return prev;
      const oldIndex = toCol.tickets.findIndex((t) => String(t.id) === String(id));
      let newIndex = isColId(over.id)
        ? toCol.tickets.length - 1
        : toCol.tickets.findIndex((t) => String(t.id) === String(over.id));
      if (newIndex < 0) newIndex = toCol.tickets.length - 1;
      const reordered = arrayMove(toCol.tickets, oldIndex, Math.max(0, newIndex));
      const next = prev.map((c) => (c.id === to ? { ...c, tickets: reordered } : c));
      persistMove(id, to, reordered.map((t) => t.id));
      return next;
    });
  };

  const persistMove = (ticketId, columnId, orderedIds) => {
    router.patch(
      `/tickets/${ticketId}/move`,
      { column_id: columnId, ordered_ids: orderedIds },
      { preserveScroll: true, preserveState: true },
    );
  };

  // ---- columns ----
  const confirmColumn = () => {
    const name = newCol.trim();
    if (!name) {
      setAddingColumn(false);
      setNewCol("");
      return;
    }
    router.post(
      "/columns",
      { project_id: project.id, name },
      { preserveScroll: true, onSuccess: () => { setAddingColumn(false); setNewCol(""); } },
    );
  };

  const removeColumn = (column) => {
    if (column.tickets.length > 0) {
      window.alert("Move or archive this column's tickets before removing it.");
      return;
    }
    if (!window.confirm(`Remove the "${column.name}" column?`)) return;
    router.delete(`/columns/${column.id}`, { preserveScroll: true });
  };

  const restoreTicket = (ticket) =>
    router.post(`/tickets/${ticket.id}/restore`, {}, { preserveScroll: true });

  return (
    <div className="tikit-bg flex h-screen w-full flex-col overflow-hidden">
      <Head title={`${project.key} board`} />

      <TopBar
        project={project}
        projects={props.projects}
        team={team}
        filterUser={filterUser}
        onFilterChange={setFilterUser}
        onCreate={() => setTicketModal({ open: true, ticket: null, columnId: defaultColumnId })}
        onNewBoard={() => setNewBoardOpen(true)}
        onDeleteBoard={() => setDeleteBoardOpen(true)}
        archivedCount={archivedTickets.length}
        onShowArchive={() => setArchiveOpen(true)}
        unlinkedPrCount={unlinkedPullRequests.length}
        onShowPullRequests={() => setPrDrawerOpen(true)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <main className="flex min-h-0 flex-1 items-start gap-3.5 overflow-x-auto px-[18px] pb-2 pt-[18px]">
          {viewColumns.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              dndEnabled={dndEnabled}
              onOpenTicket={(t) => setTicketModal({ open: true, ticket: t, columnId: t.columnId })}
              onAddTicket={(columnId) => setTicketModal({ open: true, ticket: null, columnId })}
              onRemove={removeColumn}
            />
          ))}

          {/* add column */}
          <section className="w-[268px] flex-none">
            {addingColumn ? (
              <div className="rounded-[14px] border border-white/10 bg-[#111A2E]/70 p-[11px]">
                <input
                  autoFocus
                  value={newCol}
                  onChange={(e) => setNewCol(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmColumn();
                    if (e.key === "Escape") { setAddingColumn(false); setNewCol(""); }
                  }}
                  placeholder="Column name"
                  className="w-full rounded-[9px] border border-white/[0.12] bg-[#0E1424] px-[11px] py-[9px] text-[13px] outline-none focus:border-[#FF9A2E]/50"
                />
                <div className="mt-[9px] flex gap-2">
                  <button
                    type="button"
                    onClick={confirmColumn}
                    className="rounded-[8px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-[13px] py-2 text-[12.5px] font-bold text-white"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingColumn(false); setNewCol(""); }}
                    className="rounded-[8px] bg-white/[0.06] px-[13px] py-2 text-[12.5px] font-semibold text-[#C2CADB]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingColumn(true)}
                className="w-full rounded-[14px] border border-dashed border-white/[0.13] bg-white/[0.015] p-[13px] text-[13px] font-semibold text-[#8390AC] hover:border-white/[0.28] hover:text-[#EAEEF7]"
              >
                + Add column
              </button>
            )}
          </section>
        </main>

        <DragOverlay dropAnimation={null}>
          {activeTicket ? <TicketCardView ticket={activeTicket} overlay /> : null}
        </DragOverlay>

        <ArchiveDropzone active={Boolean(activeId)} />
      </DndContext>

      <TicketModal
        open={ticketModal.open}
        ticket={ticketModal.ticket}
        columnId={ticketModal.columnId}
        projectId={project.id}
        team={team}
        categories={categories}
        onClose={() => setTicketModal({ open: false, ticket: null, columnId: null })}
        onArchive={(ticket) => {
          setTicketModal({ open: false, ticket: null, columnId: null });
          setArchiveModal({ open: true, ticket });
        }}
      />

      <ArchiveModal
        open={archiveModal.open}
        ticket={archiveModal.ticket}
        reasons={archiveReasons}
        reasonLabels={ARCHIVE_REASON_LABELS}
        onClose={() => setArchiveModal({ open: false, ticket: null })}
      />

      <ArchiveDrawer
        open={archiveOpen}
        tickets={archivedTickets}
        reasonLabels={ARCHIVE_REASON_LABELS}
        onClose={() => setArchiveOpen(false)}
        onRestore={restoreTicket}
      />

      <UnlinkedPrDrawer
        open={prDrawerOpen}
        pullRequests={unlinkedPullRequests}
        projectKey={project.key}
        onClose={() => setPrDrawerOpen(false)}
      />

      <NewBoardModal open={newBoardOpen} onClose={() => setNewBoardOpen(false)} />

      <DeleteBoardModal
        open={deleteBoardOpen}
        project={project}
        ticketCount={
          columns.reduce((sum, c) => sum + c.tickets.length, 0) + archivedTickets.length
        }
        onClose={() => setDeleteBoardOpen(false)}
      />
    </div>
  );
}
