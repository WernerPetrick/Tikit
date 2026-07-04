# Resolves a "owner/repo" string to its GitHub repository id — the stable anchor
# that survives repo renames (see domain model). Works unauthenticated for public
# repos; set GITHUB_TOKEN for private repos / higher rate limits.
#
# Returns a Result on success, or nil if the repo can't be resolved (not found,
# unauthorized, network error). Callers surface a friendly message on nil.
class GithubRepoResolver
  Result = Struct.new(:github_repo_id, :full_name, keyword_init: true)

  def self.call(full_name)
    new(full_name).call
  end

  def initialize(full_name)
    @full_name = full_name.to_s.strip.delete_prefix("https://github.com/").chomp("/")
  end

  def call
    return nil unless @full_name.match?(%r{\A[\w.-]+/[\w.-]+\z})

    repo = client.repository(@full_name)
    Result.new(github_repo_id: repo.id, full_name: repo.full_name)
  rescue Octokit::Error, Faraday::Error => e
    Rails.logger.info("[GithubRepoResolver] #{@full_name} failed: #{e.class}")
    nil
  end

  private

  def client
    @client ||= Octokit::Client.new(access_token: ENV["GITHUB_TOKEN"].presence)
  end
end
