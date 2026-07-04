class Ticket < ApplicationRecord
  # Required, no default — chosen deliberately at creation.
  CATEGORIES = %w[bug feature discovery maintenance].freeze

  # Seeded archive reasons (spec). Per-project custom reasons are deferred.
  ARCHIVE_REASONS = %w[completed wont_do duplicate out_of_scope obsolete].freeze

  belongs_to :project
  belongs_to :column
  belongs_to :reporter, class_name: "User"
  belongs_to :assignee, class_name: "User", optional: true
  belongs_to :archived_by, class_name: "User", optional: true

  has_many :pull_requests, dependent: :nullify
  has_many :activities, as: :subject, dependent: :destroy

  validates :title, presence: true
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :ticket_number, presence: true, uniqueness: { scope: :project_id }
  validates :position, presence: true
  validates :archive_reason, inclusion: { in: ARCHIVE_REASONS }, allow_nil: true

  before_validation :assign_ticket_number, on: :create
  before_validation :assign_position, on: :create

  scope :on_board, -> { where(archived_at: nil) }
  scope :archived, -> { where.not(archived_at: nil) }

  # key = project.key + "-" + ticket_number, derived not stored.
  def key
    "#{project.key}-#{ticket_number}"
  end

  def archived?
    archived_at.present?
  end

  # Soft, terminal archive. Retains the ticket and its column; restorable.
  def archive!(reason:, note: nil, by: nil)
    update!(archived_at: Time.current, archive_reason: reason, archive_note: note, archived_by: by)
  end

  # Returns the ticket to the board in the column it was archived from.
  def restore!
    update!(archived_at: nil, archive_reason: nil, archive_note: nil, archived_by: nil)
  end

  private

  def assign_ticket_number
    return if ticket_number.present? || project.nil?

    self.ticket_number = project.next_ticket_number!
  end

  def assign_position
    return if position.present? || column.nil?

    self.position = (column.tickets.maximum(:position) || 0) + 1
  end
end
