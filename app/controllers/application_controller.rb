class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Everything is auth-locked except the login + OAuth endpoints, which opt out
  # via `skip_before_action :require_authentication`.
  before_action :require_authentication

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end
  helper_method :current_user

  def signed_in?
    current_user.present?
  end
  helper_method :signed_in?

  # Exposed to every Inertia page.
  inertia_share do
    {
      currentUser: current_user && UserPresenter.new(current_user).as_json,
      flash: { notice: flash.notice, alert: flash.alert },
    }
  end

  private

  def require_authentication
    return if signed_in?

    redirect_to login_path
  end
end
