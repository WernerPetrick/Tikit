require "rails_helper"

RSpec.describe "Projects (boards)", type: :request do
  let!(:user) { create(:user, github_login: "maya") }

  before { sign_in(user) }

  def resolver_returns(id, full_name)
    result = GithubRepoResolver::Result.new(github_repo_id: id, full_name: full_name)
    allow(GithubRepoResolver).to receive(:call).and_return(result)
  end

  describe "POST /projects" do
    it "creates a board with a linked repository and default columns" do
      resolver_returns(123_456, "acme/api")

      expect {
        post "/projects", params: { name: "Acme API", key: "api", repo_full_name: "acme/api" }
      }.to change(Project, :count).by(1)

      project = Project.find_by(key: "API") # upcased
      expect(project.name).to eq("Acme API")
      expect(project.repositories.first.github_repo_id).to eq(123_456)
      expect(project.repositories.first.full_name).to eq("acme/api")
      expect(project.columns.order(:position).pluck(:name)).to eq(["Backlog", "To Do", "In Progress", "Done"])
      expect(response).to redirect_to(board_path(project))
    end

    it "rejects creation when the repository can't be resolved on GitHub" do
      allow(GithubRepoResolver).to receive(:call).and_return(nil)

      expect {
        post "/projects", params: { name: "Ghost", key: "GHOST", repo_full_name: "no/such" }
      }.not_to change(Project, :count)
    end

    it "rejects a duplicate project key" do
      create(:project, key: "DUP")
      resolver_returns(222, "acme/dup")

      expect {
        post "/projects", params: { name: "Dup", key: "DUP", repo_full_name: "acme/dup" }
      }.not_to change(Project, :count)
    end

    it "rejects linking a repository already used by another board" do
      existing = create(:project, key: "OLD")
      existing.repositories.create!(github_repo_id: 999, full_name: "acme/web")
      resolver_returns(999, "acme/web")

      expect {
        post "/projects", params: { name: "New", key: "NEW", repo_full_name: "acme/web" }
      }.not_to change(Project, :count)
    end
  end

  describe "DELETE /projects/:id" do
    it "hard-deletes the board and everything under it, redirecting to root" do
      project = create(:project, key: "GONE")
      repo = create(:repository, project: project)
      col = create(:column, project: project, name: "To Do")
      ticket = create(:ticket, project: project, column: col, category: "bug")
      create(:ticket, :archived, project: project, column: col, category: "bug")
      pr = create(:pull_request, repository: repo, ticket: ticket)
      create(:activity, subject: ticket, action: "ticket_created")

      expect { delete "/projects/#{project.id}" }.to change(Project, :count).by(-1)

      expect(Column.where(project_id: project.id)).to be_empty
      expect(Ticket.where(project_id: project.id)).to be_empty
      expect(Repository.where(project_id: project.id)).to be_empty
      expect(PullRequest.where(id: pr.id)).to be_empty
      expect(response).to redirect_to(root_path)
    end

    it "leaves other boards untouched" do
      keep = create(:project, key: "KEEP")
      create(:column, project: keep, name: "To Do")
      doomed = create(:project, key: "DOOM")

      delete "/projects/#{doomed.id}"

      expect(Project.exists?(keep.id)).to be(true)
      expect(Project.exists?(doomed.id)).to be(false)
    end
  end

  describe "switching boards" do
    it "renders the requested project's board" do
      a = create(:project, key: "AAA", name: "Alpha")
      create(:column, project: a, name: "To Do")
      b = create(:project, key: "BBB", name: "Beta")

      get board_path(b)
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("BBB")
    end
  end

  describe "no boards" do
    it "renders the NoBoards page when none exist" do
      get "/"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("NoBoards")
    end
  end
end
