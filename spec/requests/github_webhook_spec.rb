require "rails_helper"

RSpec.describe "GitHub PR webhook", type: :request do
  let(:secret) { "shhh-secret" }
  let(:project) { create(:project, key: "WEB") }
  let(:repository) { create(:repository, project: project, github_repo_id: 12_345) }
  let(:column) { create(:column, project: project) }
  let!(:ticket) do
    create(:ticket, project: project, column: column, category: "feature").tap do |t|
      # force a known ticket_number for a predictable key (WEB-7)
      t.update_column(:ticket_number, 7)
    end
  end

  around do |example|
    prev = ENV["GITHUB_WEBHOOK_SECRET"]
    ENV["GITHUB_WEBHOOK_SECRET"] = secret
    example.run
  ensure
    ENV["GITHUB_WEBHOOK_SECRET"] = prev
  end

  def payload(title:, pr_id: 999, number: 42, state: "open", merged: false)
    {
      action: "opened",
      repository: { id: repository.github_repo_id, full_name: repository.full_name },
      pull_request: {
        id: pr_id,
        number: number,
        title: title,
        html_url: "https://github.com/#{repository.full_name}/pull/#{number}",
        state: state,
        merged: merged,
        user: { login: "octodev" },
      },
    }.to_json
  end

  def post_webhook(body, signature: nil, event: "pull_request")
    sig = signature || "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", secret, body)
    post "/webhooks/github", params: body,
         headers: {
           "Content-Type" => "application/json",
           "X-GitHub-Event" => event,
           "X-Hub-Signature-256" => sig,
         }
  end

  describe "signature verification" do
    it "rejects a request with a bad signature" do
      expect {
        post_webhook(payload(title: "x [WEB-7]"), signature: "sha256=deadbeef")
      }.not_to change(PullRequest, :count)
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "linking" do
    it "creates a PR and links it to the ticket named in the title" do
      expect {
        post_webhook(payload(title: "Fix checkout flow [WEB-7]"))
      }.to change(PullRequest, :count).by(1)

      pr = PullRequest.last
      expect(pr.ticket).to eq(ticket)
      expect(pr.pr_number).to eq(42)
      expect(pr.author_login).to eq("octodev")
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("linked")
    end

    it "stores a PR with no key as unlinked-but-visible" do
      post_webhook(payload(title: "Just a refactor"))
      pr = PullRequest.last
      expect(pr.ticket).to be_nil
      expect(PullRequest.unlinked).to include(pr)
      expect(response.parsed_body["status"]).to eq("unlinked")
    end

    it "stores a PR whose key points at a non-existent ticket as unlinked" do
      post_webhook(payload(title: "Wat [WEB-999]"))
      expect(PullRequest.last.ticket).to be_nil
    end

    it "re-links on an edited retitle (idempotent on github_pr_id)" do
      post_webhook(payload(title: "No key yet", pr_id: 777))
      expect(PullRequest.find_by(github_pr_id: 777).ticket).to be_nil

      expect {
        post_webhook(payload(title: "Now linked [WEB-7]", pr_id: 777))
      }.not_to change(PullRequest, :count)
      expect(PullRequest.find_by(github_pr_id: 777).ticket).to eq(ticket)
    end
  end

  describe "state mapping" do
    it "maps merged PRs to the merged state" do
      post_webhook(payload(title: "Done [WEB-7]", state: "closed", merged: true))
      expect(PullRequest.last.state).to eq("merged")
    end

    it "maps an open PR to open and a closed-not-merged PR to closed" do
      post_webhook(payload(title: "A [WEB-7]", pr_id: 1, state: "open"))
      post_webhook(payload(title: "B [WEB-7]", pr_id: 2, state: "closed", merged: false))
      expect(PullRequest.find_by(github_pr_id: 1).state).to eq("open")
      expect(PullRequest.find_by(github_pr_id: 2).state).to eq("closed")
    end
  end

  describe "scoping" do
    it "ignores events for repositories we don't track" do
      body = {
        action: "opened",
        repository: { id: 99_999, full_name: "someone/else" },
        pull_request: { id: 5, number: 1, title: "x [WEB-7]", html_url: "u", state: "open", merged: false, user: { login: "x" } },
      }.to_json

      expect { post_webhook(body) }.not_to change(PullRequest, :count)
      expect(response.parsed_body["status"]).to eq("ignored")
    end

    it "acks non-pull_request events without processing" do
      post_webhook(payload(title: "x"), event: "push")
      expect(response).to have_http_status(:no_content)
    end
  end
end
