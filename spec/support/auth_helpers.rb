module AuthHelpers
  # Establishes a signed-in session for request specs by driving the real
  # OmniAuth callback in test mode. The allowlist gate is bypassed here — its
  # behaviour is exercised directly in spec/requests/sessions_spec.rb.
  def sign_in(user)
    OmniAuth.config.test_mode = true
    auth = OmniAuth::AuthHash.new(
      provider: "github",
      uid: user.github_id.to_s,
      info: {
        nickname: user.github_login,
        name: user.name,
        email: user.email,
        image: user.avatar_url,
      },
    )
    OmniAuth.config.mock_auth[:github] = auth
    Rails.application.env_config["omniauth.auth"] = auth
    allow(GithubAllowlist).to receive(:permit?).and_return(true)
    get "/auth/github/callback"
  end

  # Build an OmniAuth hash for a not-yet-provisioned GitHub identity.
  def github_auth(uid:, nickname:, name: nil, email: nil)
    OmniAuth::AuthHash.new(
      provider: "github",
      uid: uid.to_s,
      info: { nickname: nickname, name: name || nickname, email: email, image: nil },
    )
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request

  config.after do
    OmniAuth.config.mock_auth[:github] = nil
    Rails.application.env_config["omniauth.auth"] = nil
  end
end
