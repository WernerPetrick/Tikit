# The provisioning allowlist (see config/initializers/github_allowlist.rb).
module GithubAllowlist
  module_function

  def logins
    Rails.application.config.x.github_allowlist || []
  end

  def permit?(login)
    login.present? && logins.include?(login.to_s.downcase)
  end
end
