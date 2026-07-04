# GitHub OAuth (login). The GitHub *App* (read-only PRs + webhook) is a separate
# concern; this is just the sign-in identity provider.
#
# Credentials come from the environment so they stay out of the repo:
#   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :github,
           ENV["GITHUB_CLIENT_ID"],
           ENV["GITHUB_CLIENT_SECRET"],
           scope: "read:user,user:email"
end

# Don't leak the raw error to the user; route failures through our controller.
# Wrapped in a proc so the constant resolves at request time, not boot time.
OmniAuth.config.on_failure = proc { |env| SessionsController.action(:failure).call(env) }
OmniAuth.config.silence_get_warning = true
