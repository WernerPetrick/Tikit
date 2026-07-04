require "rails_helper"

RSpec.describe "Sessions", type: :request do
  before { OmniAuth.config.test_mode = true }

  def callback_with(auth)
    OmniAuth.config.mock_auth[:github] = auth
    Rails.application.env_config["omniauth.auth"] = auth
    get "/auth/github/callback"
  end

  describe "auth gate" do
    it "redirects unauthenticated requests to the login page" do
      get "/"
      expect(response).to redirect_to(login_path)
    end

    it "renders the login page" do
      get "/login"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Login") # inertia component name
    end
  end

  describe "GET /auth/github/callback" do
    context "when the GitHub login is on the allowlist" do
      around do |ex|
        prev = Rails.application.config.x.github_allowlist
        Rails.application.config.x.github_allowlist = %w[maya maya_renamed]
        ex.run
        Rails.application.config.x.github_allowlist = prev
      end

      it "provisions the user and signs them in" do
        auth = github_auth(uid: 42, nickname: "maya", name: "Maya Chen", email: "maya@acme.test")

        expect { callback_with(auth) }.to change(User, :count).by(1)
        user = User.find_by(github_id: 42)
        expect(user.github_login).to eq("maya")
        expect(response).to redirect_to(root_path)

        follow_redirect! # now authenticated, board loads
        expect(response).to have_http_status(:ok)
      end

      it "reuses the existing user on re-login (github_id is the anchor)" do
        existing = create(:user, github_id: 42, github_login: "old_handle", name: "Maya")
        auth = github_auth(uid: 42, nickname: "maya_renamed", name: "Maya Chen")

        expect { callback_with(auth) }.not_to change(User, :count)
        expect(existing.reload.github_login).to eq("maya_renamed")
      end
    end

    context "when the GitHub login is NOT on the allowlist" do
      around do |ex|
        prev = Rails.application.config.x.github_allowlist
        Rails.application.config.x.github_allowlist = %w[maya]
        ex.run
        Rails.application.config.x.github_allowlist = prev
      end

      it "refuses to provision and redirects to login with an alert" do
        auth = github_auth(uid: 99, nickname: "intruder")

        expect { callback_with(auth) }.not_to change(User, :count)
        expect(response).to redirect_to(login_path)
        expect(flash[:alert]).to match(/allowlist/i)
      end
    end
  end

  describe "DELETE /logout" do
    it "clears the session" do
      user = create(:user, github_login: "maya")
      sign_in(user)
      expect(session[:user_id]).to eq(user.id)

      delete "/logout"
      expect(response).to redirect_to(login_path)
      expect(session[:user_id]).to be_nil
    end
  end
end
