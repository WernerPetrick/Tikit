class TicketsController < ApplicationController
  before_action :set_ticket, only: %i[update move archive restore]

  def create
    project = Project.find(params[:project_id])
    column = project.columns.find(params[:column_id])
    ticket = project.tickets.build(create_params)
    ticket.column = column
    ticket.reporter = current_user

    if ticket.save
      redirect_to board_path(project), notice: "#{ticket.key} created"
    else
      redirect_to board_path(project), inertia: { errors: ticket.errors }
    end
  end

  def update
    if @ticket.update(update_params)
      redirect_to board_path(@ticket.project), notice: "#{@ticket.key} updated"
    else
      redirect_to board_path(@ticket.project), inertia: { errors: @ticket.errors }
    end
  end

  # Persist a drag: target column + the full ordered list of ticket ids in that
  # column. We renumber positions from the array so order is canonical and
  # gap-free (integer renumber-on-move is fine at this scale — see spec).
  def move
    target_column = @ticket.project.columns.find(params[:column_id])
    ordered_ids = Array(params[:ordered_ids]).map(&:to_i)

    Ticket.transaction do
      @ticket.update!(column: target_column)
      ordered_ids.each_with_index do |id, index|
        target_column.tickets.where(id: id).update_all(position: index + 1)
      end
    end

    redirect_to board_path(@ticket.project)
  end

  def archive
    @ticket.archive!(
      reason: params[:reason],
      note: params[:note].presence,
      by: current_user,
    )
    redirect_to board_path(@ticket.project), notice: "#{@ticket.key} archived"
  end

  def restore
    @ticket.restore!
    redirect_to board_path(@ticket.project), notice: "#{@ticket.key} restored"
  end

  private

  def set_ticket
    @ticket = Ticket.find(params[:id])
  end

  def create_params
    params.permit(:title, :description, :category, :assignee_id)
  end

  def update_params
    params.permit(:title, :description, :category, :assignee_id)
  end
end
