class ColumnsController < ApplicationController
  def create
    project = Project.find(params[:project_id])
    next_position = (project.columns.maximum(:position) || 0) + 1
    column = project.columns.build(name: params[:name], position: next_position)

    if column.save
      redirect_to board_path(project), notice: "Column added"
    else
      redirect_to board_path(project), inertia: { errors: column.errors }
    end
  end

  def update
    column = Column.find(params[:id])

    if column.update(name: params[:name])
      redirect_to board_path(column.project), notice: "Column renamed"
    else
      redirect_to board_path(column.project), inertia: { errors: column.errors }
    end
  end

  # Persist a column drag: the full ordered list of column ids. Positions are
  # renumbered from the array (gap-free). Tickets ride along automatically — they
  # belong to their column, so only Column#position changes here.
  def reorder
    project = Project.find(params[:project_id])
    ordered_ids = Array(params[:ordered_ids]).map(&:to_i)

    Column.transaction do
      ordered_ids.each_with_index do |id, index|
        project.columns.where(id: id).update_all(position: index + 1)
      end
    end

    redirect_to board_path(project)
  end

  def destroy
    column = Column.find(params[:id])
    project = column.project

    # Columns hold tickets even when archived state is orthogonal; refuse to drop
    # a non-empty column rather than cascade-delete tickets (no hard delete — spec).
    if column.tickets.exists?
      redirect_to board_path(project), alert: "Move or archive its tickets before removing this column"
    else
      column.destroy
      redirect_to board_path(project), notice: "Column removed"
    end
  end
end
