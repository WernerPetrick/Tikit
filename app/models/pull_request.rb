class PullRequest < ApplicationRecord
  STATES = %w[open closed merged].freeze

  # Ticket key in brackets at the end of the PR title, e.g. "Fix checkout [PROJ-42]".
  KEY_PATTERN = /\[([A-Z][A-Z0-9]*)-(\d+)\]\s*\z/

  belongs_to :repository
  # nullable — a PR with no/malformed/dangling key is stored unlinked-but-visible.
  belongs_to :ticket, optional: true

  has_many :activities, as: :subject, dependent: :destroy

  validates :github_pr_id, presence: true, uniqueness: true
  validates :pr_number, presence: true
  validates :state, inclusion: { in: STATES }

  scope :unlinked, -> { where(ticket_id: nil) }

  # Parse the key from the title and resolve it to a ticket within this
  # repository's project. Returns the ticket or nil (left unlinked-but-visible).
  def resolve_ticket
    match = title.to_s.match(KEY_PATTERN)
    return nil unless match

    project_key, number = match[1], match[2].to_i
    return nil unless repository.project.key == project_key

    repository.project.tickets.find_by(ticket_number: number)
  end
end
