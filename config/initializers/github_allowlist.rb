# Provisioning is allowlist-gated (security boundary): authenticating via GitHub
# is NOT sufficient — the login must be on this list (org-membership check is a
# deferred alternative). Set GITHUB_ALLOWLIST as a comma-separated list of logins.
#
# In development we fall back to the seeded team so the app is usable locally.
allowlist = ENV.fetch("GITHUB_ALLOWLIST", "").split(",").map { |l| l.strip.downcase }.reject(&:blank?)

if allowlist.empty? && Rails.env.local?
  allowlist = %w[maya dev sara tom jess]
end

Rails.application.config.x.github_allowlist = allowlist.freeze
