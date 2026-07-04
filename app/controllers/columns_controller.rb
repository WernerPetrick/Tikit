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
