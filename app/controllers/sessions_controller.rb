class SessionsController < ApplicationController
  # The login page and the OAuth dance must be reachable while signed out.
  skip_before_action :require_authentication

  # GET /login
  def new
    return redirect_to root_path if signed_in?

    render inertia: "Login", props: {
      devLogin: dev_login_available?,
    }
  end

  # GET|POST /auth/github/callback
  def create
    auth = request.env["omniauth.auth"]
    login = auth&.info&.nickname

    unless GithubAllowlist.permit?(login)
      return redirect_to login_path,
                         alert: "#{login || "That GitHub account"} isn't on the Tikit allowlist. Ask an admin to add you."
    end

    user = User.from_omniauth(auth)
    sign_in(user)
    redirect_to root_path, notice: "Signed in as #{user.github_login}"
  end

  # GET|POST /auth/failure
  def failure
    redirect_to login_path, alert: "GitHub sign-in failed or was cancelled."
  end

  # DELETE /logout
  def destroy
    reset_session
    redirect_to login_path, notice: "Signed out."
  end

  # POST /dev_login — local convenience when OAuth creds aren't configured.
  def dev_create
    raise ActionController::RoutingError, "Not Found" unless dev_login_available?

    user = User.find_by(github_login: params[:login]) || User.first
    return redirect_to login_path, alert: "No seeded users — run bin/rails db:seed." unless user

    sign_in(user)
    redirect_to root_path, notice: "Signed in as #{user.github_login} (dev)"
  end

  private

  def sign_in(user)
    reset_session # guard against session fixation
    session[:user_id] = user.id
  end

  def dev_login_available?
    Rails.env.development? && ENV["GITHUB_CLIENT_ID"].blank?
  end
  helper_method :dev_login_available?
end
