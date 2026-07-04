# Shapes a Ticket for the board. The derived key (PROJ-42) is sent here since it
# depends on the project; category colour is resolved client-side from `category`.
class TicketPresenter
  def initialize(ticket)
    @ticket = ticket
  end

  def as_json(*)
    {
      id: @ticket.id,
      key: @ticket.key,
      title: @ticket.title,
      description: @ticket.description.to_s,
      category: @ticket.category,
      columnId: @ticket.column_id,
      position: @ticket.position,
      assignee: @ticket.assignee && UserPresenter.new(@ticket.assignee).as_json,
      pullRequests: @ticket.pull_requests
                           .sort_by { |pr| pr.pr_number.to_i }
                           .map { |pr| PullRequestPresenter.new(pr).as_json },
    }
  end
end
