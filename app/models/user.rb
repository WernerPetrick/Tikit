class User < ApplicationRecord
  # GitHub OAuth; allowlist-gated provisioning (see SessionsController).
  has_many :reported_tickets, class_name: "Ticket", foreign_key: :reporter_id,
                              dependent: :restrict_with_exception, inverse_of: :reporter
  has_many :assigned_tickets, class_name: "Ticket", foreign_key: :assignee_id,
                              dependent: :nullify, inverse_of: :assignee
  has_many :activities, foreign_key: :actor_id, dependent: :nullify, inverse_of: :actor

  validates :github_id, presence: true, uniqueness: true
  validates :github_login, presence: true

  # Find-or-provision from an OmniAuth hash. github_id is the stable anchor, so a
  # user who renamed their handle still resolves to the same record. Caller is
  # responsible for the allowlist check before provisioning (see SessionsController).
  def self.from_omniauth(auth)
    user = find_or_initialize_by(github_id: auth.uid.to_i)
    user.github_login = auth.info.nickname
    user.name = auth.info.name.presence || auth.info.nickname
    user.email = auth.info.email
    user.avatar_url = auth.info.image
    user.save!
    user
  end
end
