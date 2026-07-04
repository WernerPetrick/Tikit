require "rails_helper"

RSpec.describe "Board flow", type: :request do
  # current_user is stubbed to User.first until auth lands.
  let!(:reporter) { create(:user, name: "Maya Chen") }
  let!(:assignee) { create(:user, name: "Dev Patel") }
  let!(:project) { create(:project, key: "WEB", name: "Acme Web App") }
  let!(:todo) { create(:column, project: project, name: "To Do", position: 1) }
  let!(:doing) { create(:column, project: project, name: "In Progress", position: 2) }

  before { sign_in(reporter) }

  describe "GET /" do
    it "renders the Board component with columns and tickets" do
      create(:ticket, project: project, column: todo, category: "feature", title: "OAuth login")

      get "/"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("WEB")
      expect(response.body).to include("OAuth login")
    end
  end

  describe "POST /tickets" do
    it "creates a ticket with an allocated key and current_user as reporter" do
      expect {
        post "/tickets", params: {
          project_id: project.id, column_id: todo.id,
          title: "Add 2FA", category: "feature", assignee_id: assignee.id,
        }
      }.to change(Ticket, :count).by(1)

      ticket = Ticket.last
      expect(ticket.key).to eq("WEB-1")
      expect(ticket.reporter).to eq(reporter) # User.first
      expect(ticket.assignee).to eq(assignee)
      expect(response).to redirect_to(board_path(project))
    end

    it "rejects a ticket without a category" do
      expect {
        post "/tickets", params: { project_id: project.id, column_id: todo.id, title: "No cat" }
      }.not_to change(Ticket, :count)
    end
  end

  describe "PATCH /tickets/:id/move" do
    it "moves a ticket to another column and renumbers positions" do
      a = create(:ticket, project: project, column: todo, category: "bug", title: "A")
      b = create(:ticket, project: project, column: todo, category: "bug", title: "B")

      patch "/tickets/#{a.id}/move", params: { column_id: doing.id, ordered_ids: [a.id] }

      expect(a.reload.column).to eq(doing)
      expect(a.position).to eq(1)
      expect(b.reload.column).to eq(todo)
    end
  end

  describe "archive + restore" do
    it "archives with a reason then restores to the same column" do
      ticket = create(:ticket, project: project, column: doing, category: "bug", title: "Flaky")

      post "/tickets/#{ticket.id}/archive", params: { reason: "duplicate", note: "dup of WEB-2" }
      ticket.reload
      expect(ticket).to be_archived
      expect(ticket.archive_reason).to eq("duplicate")
      expect(ticket.archived_by).to eq(reporter)

      post "/tickets/#{ticket.id}/restore"
      ticket.reload
      expect(ticket).not_to be_archived
      expect(ticket.column).to eq(doing) # column preserved across archive/restore
    end
  end

  describe "columns" do
    it "creates and removes an empty column but refuses a non-empty one" do
      post "/columns", params: { project_id: project.id, name: "Review" }
      review = project.columns.find_by(name: "Review")
      expect(review).to be_present
      expect(review.position).to eq(3)

      create(:ticket, project: project, column: review, category: "feature")
      expect { delete "/columns/#{review.id}" }.not_to change(Column, :count)
      expect(flash[:alert]).to be_present
    end

    it "renames a column" do
      patch "/columns/#{todo.id}", params: { name: "Up Next" }
      expect(todo.reload.name).to eq("Up Next")
      expect(response).to redirect_to(board_path(project))
    end

    it "reorders columns by renumbering positions from the given order" do
      # todo=pos1, doing=pos2 → swap them
      patch "/columns/reorder", params: { project_id: project.id, ordered_ids: [doing.id, todo.id] }

      expect(doing.reload.position).to eq(1)
      expect(todo.reload.position).to eq(2)
      # tickets are untouched — they belong to their column
      expect(response).to redirect_to(board_path(project))
    end
  end
end
