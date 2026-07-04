class BoardsController < ApplicationController
  # The board for one project. Without an id we fall back to the first project
  # (the repo/project switcher in the top bar will drive this once multi-project
  # navigation lands).
  def show
    @project = params[:project_id] ? Project.find(params[:project_id]) : Project.first

    return render inertia: "NoBoards" if @project.nil?

    render inertia: "Board", props: {
      project: { id: @project.id, name: @project.name, key: @project.key },
      projects: project_list,
      repositories: @project.repositories.order(:full_name).map { |r| { id: r.id, fullName: r.full_name } },
      columns: columns_payload,
      team: User.order(:name).map { |u| UserPresenter.new(u).as_json },
      categories: Ticket::CATEGORIES,
      archiveReasons: Ticket::ARCHIVE_REASONS,
      archivedTickets: archived_payload,
      unlinkedPullRequests: unlinked_prs_payload,
    }
  end

  private

  def project_list
    Project.order(:name).includes(:repositories).map do |p|
      { id: p.id, name: p.name, key: p.key, repoFullName: p.repositories.first&.full_name }
    end
  end

  def unlinked_prs_payload
    PullRequest.unlinked
               .joins(:repository)
               .where(repositories: { project_id: @project.id })
               .includes(:repository)
               .order(created_at: :desc)
               .map { |pr| PullRequestPresenter.new(pr).as_json }
  end

  def archived_payload
    @project.tickets.archived
            .order(archived_at: :desc)
            .includes(:column, :assignee)
            .map do |t|
      {
        id: t.id,
        key: t.key,
        title: t.title,
        category: t.category,
        columnName: t.column.name,
        archiveReason: t.archive_reason,
        archiveNote: t.archive_note,
      }
    end
  end

  def columns_payload
    columns = @project.columns.order(:position).to_a
    tickets_by_column = @project.tickets.on_board
                                .order(:position)
                                .includes(:assignee, pull_requests: :repository)
                                .group_by(&:column_id)

    columns.map do |column|
      tickets = (tickets_by_column[column.id] || []).map { |t| TicketPresenter.new(t).as_json }
      { id: column.id, name: column.name, position: column.position, tickets: tickets }
    end
  end
end
