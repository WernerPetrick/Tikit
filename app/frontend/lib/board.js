// Presentation helpers shared across board components. The backend ships raw
// identity (category string, assignee {id,name,...}); colour + initials are
// derived here so the palette lives in one place.

export const CATEGORY_META = {
  bug: { label: "Bug", color: "#FB5A5A" },
  feature: { label: "Feature", color: "#FF8A2E" },
  discovery: { label: "Discovery", color: "#A78BFA" },
  maintenance: { label: "Maintenance", color: "#2DD4BF" },
};

export function categoryColor(category) {
  return CATEGORY_META[category]?.color ?? "#FF8A2E";
}

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label ?? category;
}

const AVATAR_COLORS = [
  "#6366F1", "#0EA5E9", "#EC4899", "#22C55E",
  "#F59E0B", "#A78BFA", "#2DD4BF", "#FB7185",
];

// Deterministic colour per user so the same person is always the same hue.
export function avatarColor(user) {
  if (!user) return "#3B4763";
  const seed = String(user.id ?? user.login ?? "");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const PR_STATE_META = {
  open: { label: "Open", color: "#22C55E" },
  merged: { label: "Merged", color: "#A78BFA" },
  closed: { label: "Closed", color: "#FB5A5A" },
};

export function prStateMeta(state) {
  return PR_STATE_META[state] || PR_STATE_META.open;
}

// The colour a card's PR badge takes: merged wins, then open, then closed.
export function aggregatePrState(pullRequests = []) {
  if (pullRequests.some((pr) => pr.state === "open")) return "open";
  if (pullRequests.some((pr) => pr.state === "merged")) return "merged";
  if (pullRequests.length) return "closed";
  return null;
}

export const ARCHIVE_REASON_LABELS = {
  completed: "Completed",
  wont_do: "Won't do",
  duplicate: "Duplicate",
  out_of_scope: "Out of scope",
  obsolete: "Obsolete",
};
