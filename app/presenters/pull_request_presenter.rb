# Shapes a PullRequest for the board (ticket PR badges + the unlinked-PR surface).
class PullRequestPresenter
  def initialize(pull_request)
    @pr = pull_request
  end

  def as_json(*)
    {
      id: @pr.id,
      number: @pr.pr_number,
      title: @pr.title,
      state: @pr.state,
      url: @pr.url,
      authorLogin: @pr.author_login,
      repoFullName: @pr.repository.full_name,
    }
  end
end
