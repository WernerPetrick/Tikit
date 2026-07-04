class ProjectsController < ApplicationController
  # A new board starts with a sensible default column set (columns stay fully
  # user-editable afterwards — no enforced workflow).
  DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"].freeze

  def create
    full_name = params[:repo_full_name].to_s.strip
    project = Project.new(name: params[:name], key: params[:key])
    project.valid? # populate name/key validation errors

    repo = full_name.present? ? GithubRepoResolver.call(full_name) : nil
    if full_name.blank?
      project.errors.add(:repo_full_name, "is required — link a GitHub repository (owner/repo)")
    elsif repo.nil?
      project.errors.add(:repo_full_name, "couldn't be found on GitHub: #{full_name}")
    end

    if project.errors.empty?
      create_board!(project, repo)
      redirect_to board_path(project), notice: "Board #{project.key} created"
    else
      redirect_back fallback_location: root_path, inertia: { errors: project.errors }
    end
  rescue ActiveRecord::RecordNotUnique
    project.errors.add(:repo_full_name, "is already linked to another board")
    redirect_back fallback_location: root_path, inertia: { errors: project.errors }
  end

  # Hard-delete a board and everything under it (tickets, PRs, columns, repos,
  # activities). Irreversible — the UI gates this behind type-the-key confirmation.
  def destroy
    project = Project.find(params[:id])

    ActiveRecord::Base.transaction do
      purge_activities!(project)
      # Columns restrict destruction while they hold tickets, so clear tickets
      # first (also nullifies their PRs); the project then cascades columns + repos.
      project.tickets.destroy_all
      project.destroy!
    end

    redirect_to root_path, notice: "Board #{project.key} deleted"
  end

  private

  # Activities are append-only (destroy is guarded), but a full board hard-delete
  # legitimately purges its audit trail. delete_all bypasses the guard + callbacks.
  def purge_activities!(project)
    ticket_ids = project.tickets.ids
    pr_ids = PullRequest.joins(:repository).where(repositories: { project_id: project.id }).ids

    Activity.where(subject_type: "Ticket", subject_id: ticket_ids).delete_all
    Activity.where(subject_type: "PullRequest", subject_id: pr_ids).delete_all
    Activity.where(subject_type: "Project", subject_id: project.id).delete_all
  end

  def create_board!(project, repo)
    ActiveRecord::Base.transaction do
      project.save!
      project.repositories.create!(github_repo_id: repo.github_repo_id, full_name: repo.full_name)
      DEFAULT_COLUMNS.each_with_index do |name, i|
        project.columns.create!(name: name, position: i + 1)
      end
    end
  end
end
