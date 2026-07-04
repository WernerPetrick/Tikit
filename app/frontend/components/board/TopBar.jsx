import { router, usePage } from "@inertiajs/react";
import { avatarColor, initials } from "../../lib/board";
import BoardSwitcher from "./BoardSwitcher";

export default function TopBar({
  project,
  projects,
  team,
  filterUser,
  onFilterChange,
  onCreate,
  onNewBoard,
  onDeleteBoard,
  archivedCount,
  onShowArchive,
  unlinkedPrCount,
  onShowPullRequests,
}) {
  const { currentUser } = usePage().props;
  const signOut = () => router.delete("/logout");

  return (
    <header className="relative z-50 flex h-[60px] flex-none items-center gap-[18px] border-b border-white/[0.07] bg-[#0A0F1A]/65 px-5 backdrop-blur-[8px]">
      {/* brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] shadow-[0_4px_14px_rgba(255,92,42,0.35)]">
          <div className="h-[9px] w-[13px] rounded-[2px] border-2 border-white" />
        </div>
        <span className="bg-gradient-to-br from-[#FFB24D] via-[#FF5C2A] to-[#FF3E3F] bg-clip-text text-[19px] font-extrabold tracking-[-0.02em] text-transparent">
          tikit
        </span>
      </div>

      <div className="h-[22px] w-px bg-white/10" />

      {/* board (project) switcher + create new board */}
      <BoardSwitcher
        project={project}
        projects={projects}
        onNewBoard={onNewBoard}
        onDeleteBoard={onDeleteBoard}
      />

      <div className="flex-1" />

      {/* unlinked PRs surface */}
      <button
        type="button"
        onClick={onShowPullRequests}
        className="rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#7E8AA3] hover:bg-white/[0.05] hover:text-[#EAEEF7]"
        title="Pull requests with no linked ticket"
      >
        PRs
        {unlinkedPrCount > 0 && (
          <span className="ml-1.5 rounded-full bg-[#FF9A2E]/20 px-[7px] py-px font-mono text-[11px] text-[#FF9A2E]">
            {unlinkedPrCount}
          </span>
        )}
      </button>

      {/* archive link */}
      <button
        type="button"
        onClick={onShowArchive}
        className="rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#7E8AA3] hover:bg-white/[0.05] hover:text-[#EAEEF7]"
        title="View archived tickets"
      >
        Archive
        {archivedCount > 0 && (
          <span className="ml-1.5 rounded-full bg-white/[0.08] px-[7px] py-px font-mono text-[11px]">
            {archivedCount}
          </span>
        )}
      </button>

      {/* assignee filter */}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-[11px] font-semibold text-[#7E8AA3]">
          Assignee
        </span>
        <select
          value={filterUser}
          onChange={(e) => onFilterChange(e.target.value)}
          className="min-w-[188px] appearance-none rounded-[9px] border border-white/[0.08] bg-white/[0.045] py-2 pl-[78px] pr-[30px] text-[13px] font-semibold outline-none"
        >
          <option value="all">All</option>
          <option value="unassigned">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 text-[11px] text-[#7E8AA3]">▾</span>
      </div>

      {/* create */}
      <button
        onClick={() => onCreate(null)}
        className="flex items-center gap-[7px] rounded-[9px] bg-gradient-to-br from-[#FF9A2E] via-[#FF5C2A] to-[#FF3E3F] px-[15px] py-[9px] text-[13.5px] font-bold text-white shadow-[0_4px_16px_rgba(255,92,42,0.32)] hover:brightness-105"
      >
        <span className="-mt-px text-[16px] leading-none">+</span> Create ticket
      </button>

      {/* current user + sign out */}
      {currentUser && (
        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[9px] border border-white/[0.08] bg-white/[0.045] py-1.5 pl-1.5 pr-2.5 hover:bg-white/[0.07]"
            title={currentUser.name}
          >
            <span
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10.5px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
              style={{ background: avatarColor(currentUser) }}
            >
              {initials(currentUser.name)}
            </span>
            <span className="text-[11px] text-[#7E8AA3]">▾</span>
          </button>

          <div className="invisible absolute right-0 top-[calc(100%+6px)] z-50 w-[180px] rounded-[10px] border border-white/[0.08] bg-[#0F1626] p-1.5 opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition group-hover:visible group-hover:opacity-100">
            <div className="px-2.5 py-2">
              <div className="text-[12.5px] font-semibold">{currentUser.name}</div>
              <div className="font-mono text-[11px] text-[#7E8AA3]">@{currentUser.login}</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-1 w-full rounded-[7px] px-2.5 py-2 text-left text-[12.5px] font-semibold text-[#C2CADB] hover:bg-[#FB5A5A]/[0.14] hover:text-[#FB5A5A]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
