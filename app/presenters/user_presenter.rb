# Shapes a User for the Inertia/React frontend. Colour + initials are derived
# client-side from these fields, so we only ship the raw identity here.
class UserPresenter
  def initialize(user)
    @user = user
  end

  def as_json(*)
    return nil unless @user

    {
      id: @user.id,
      name: @user.name,
      login: @user.github_login,
      avatarUrl: @user.avatar_url,
    }
  end
end
