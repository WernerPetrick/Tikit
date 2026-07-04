# Idempotent dev seed: the Acme "web-app" board from the Tikit Board design.
# Safe to re-run.

team = [
  { login: "maya", name: "Maya Chen",  github_id: 5001 },
  { login: "dev",  name: "Dev Patel",  github_id: 5002 },
  { login: "sara", name: "Sara Lind",  github_id: 5003 },
  { login: "tom",  name: "Tom Okafor", github_id: 5004 },
  { login: "jess", name: "Jess Kim",   github_id: 5005 },
].map do |attrs|
  User.find_or_create_by!(github_id: attrs[:github_id]) do |u|
    u.github_login = attrs[:login]
    u.name = attrs[:name]
    u.email = "#{attrs[:login]}@acme.test"
    u.avatar_url = "https://avatars.githubusercontent.com/#{attrs[:login]}"
  end
end
by_login = team.index_by(&:github_login)

project = Project.find_or_create_by!(key: "WEB") { |p| p.name = "Acme Web App" }
project.repositories.find_or_create_by!(github_repo_id: 900_001) { |r| r.full_name = "acme/web-app" }

column_names = ["Backlog", "To Do", "In Progress", "In Review", "Done"]
columns = column_names.each_with_index.map do |name, i|
  project.columns.find_or_create_by!(name: name) { |c| c.position = i + 1 }
end
col = column_names.zip(columns).to_h

# Match the design's WEB-101.. keys: bump the counter so the first ticket is 101.
project.update!(ticket_counter: 100) if project.tickets.none?

seed_tickets = [
  { col: "To Do",       cat: "feature",     who: "maya", title: "Add OAuth login with Google" },
  { col: "In Progress", cat: "bug",         who: "dev",  title: "Password reset email not sending" },
  { col: "In Review",   cat: "bug",         who: "sara", title: "Stripe webhook retries duplicate charges" },
  { col: "To Do",       cat: "feature",     who: "jess", title: "Design new pricing page" },
  { col: "Backlog",     cat: "discovery",   who: "tom",  title: "Investigate slow dashboard load" },
  { col: "In Progress", cat: "maintenance", who: "dev",  title: "Upgrade to React 19" },
  { col: "To Do",       cat: "feature",     who: "maya", title: "Add 2FA settings screen" },
  { col: "Done",        cat: "bug",         who: "sara", title: "Invoice PDF layout broken on Safari" },
  { col: "Backlog",     cat: "feature",     who: "jess", title: "Dark mode for settings panel" },
  { col: "Backlog",     cat: "maintenance", who: "tom",  title: "Audit npm vulnerabilities" },
  { col: "In Review",   cat: "bug",         who: "dev",  title: "Session expires too quickly" },
  { col: "Backlog",     cat: "discovery",   who: "sara", title: "Research usage-based billing model" },
]

reporter = by_login["maya"]
seed_tickets.each do |attrs|
  next if project.tickets.exists?(title: attrs[:title])

  project.tickets.create!(
    title: attrs[:title],
    category: attrs[:cat],
    column: col[attrs[:col]],
    assignee: by_login[attrs[:who]],
    reporter: reporter,
  )
end

puts "Seeded #{project.key}: #{project.columns.count} columns, #{project.tickets.count} tickets, #{User.count} users."
