module Github
  # Upserts a PullRequest from a GitHub `pull_request` webhook payload and links
  # it to a ticket by parsing the key from the title. Idempotent: keyed on
  # github_pr_id, and re-run safely on every event (so an `edited` retitle
  # re-links or unlinks). A PR with no/invalid/dangling key is stored unlinked
  # but visible — never dropped.
  class PullRequestSync
    Result = Struct.new(:status, :pull_request, keyword_init: true)

    def initialize(payload)
      @payload = payload
    end

    def call
      pr_data = @payload["pull_request"]
      repo = Repository.find_by(github_repo_id: @payload.dig("repository", "id"))

      # We only track PRs for repositories that belong to a board.
      return Result.new(status: :ignored) if pr_data.nil? || repo.nil?

      pr = repo.pull_requests.find_or_initialize_by(github_pr_id: pr_data["id"])
      pr.assign_attributes(
        pr_number: pr_data["number"],
        title: pr_data["title"],
        url: pr_data["html_url"],
        author_login: pr_data.dig("user", "login"),
        state: state_for(pr_data),
      )
      pr.ticket = pr.resolve_ticket # link by key; nil => unlinked-but-visible
      pr.save!

      Result.new(status: pr.ticket ? :linked : :unlinked, pull_request: pr)
    end

    private

    # GitHub reports state as open/closed plus a separate `merged` flag.
    def state_for(pr_data)
      return "merged" if pr_data["merged"]

      pr_data["state"].presence_in(PullRequest::STATES) || "open"
    end
  end
end
